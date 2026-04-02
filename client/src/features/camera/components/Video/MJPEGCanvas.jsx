import { useEffect, useRef } from 'react';

// Component to handle MJPEG streaming using Web Worker
function MJPEGCanvas({ camId, cameraName, onStatusChange }) {
  const canvasRef = useRef(null);
  const abortControllerRef = useRef(null);
  const workerRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');

    // Create Web Worker for MJPEG parsing
    try {
      workerRef.current = new Worker(
        new URL('../../mjpegParser.worker.js', import.meta.url)
      );
    } catch (err) {
      console.error('[MJPEGCanvas] Failed to create worker:', err);
    }

    let retryCount = 0;
    const MAX_RETRIES = 20;
    const BASE_RETRY_DELAY = 1000; // 1s - avoid aggressive reconnect storms
    let componentMounted = true;

    const startStreaming = async () => {
      if (!componentMounted) return;

      // Create a FRESH AbortController for each attempt
      abortControllerRef.current = new AbortController();
      const signal = abortControllerRef.current.signal;

      try {
        onStatusChange('connecting');
        // console.log(`[MJPEGCanvas] Starting stream for camera ${camId}`); // Uncomment for debug
        
        // Set a connection timeout of 5 seconds
        const connectionTimeoutId = setTimeout(() => {
          if (signal.aborted === false) {
            console.warn(`[MJPEGCanvas] Stream connection timeout after 5s`);
            abortControllerRef.current?.abort();
          }
        }, 5000);

        const response = await fetch(
          `/video_feed?camera_id=${camId}`,
          { signal }
        );

        clearTimeout(connectionTimeoutId); // Clear timeout once connected

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }

        // console.log(`[MJPEGCanvas] Connected to stream, content-type: ${response.headers.get('content-type')}`); // Debug only
        onStatusChange('online');
        retryCount = 0; // Reset retry count on success
        const reader = response.body?.getReader();
        if (!reader) throw new Error('No stream reader');

        const frameQueue = [];
        const FRAME_QUEUE_MAX = 1; // keep only the newest frame to minimize latency
        let isRendering = false;
        let lastRenderedTimestamp = Date.now();
        let lastCanvasUpdateCheck = Date.now();
        let lastBitmapWidth = 0;
        let lastBitmapHeight = 0;

        // Rendering loop using requestAnimationFrame
        const renderFrame = async () => {
          if (frameQueue.length > 0 && canvas.offsetParent && !isRendering) {
            isRendering = true;
            const frameData = frameQueue.shift();
            try {
              // If worker decoded an ImageBitmap, draw it directly (fast, no extra decode)
              if (typeof ImageBitmap !== 'undefined' && frameData instanceof ImageBitmap) {
                const bitmap = frameData;
                if (bitmap && bitmap.width > 0 && bitmap.height > 0) {
                  if (bitmap.width !== lastBitmapWidth || bitmap.height !== lastBitmapHeight) {
                    canvas.width = bitmap.width;
                    canvas.height = bitmap.height;
                    lastBitmapWidth = bitmap.width;
                    lastBitmapHeight = bitmap.height;
                  }
                  ctx.drawImage(bitmap, 0, 0);
                  lastRenderedTimestamp = Date.now();
                  try { bitmap.close(); } catch (e) {}
                }
              } else {
                // Fallback: raw Uint8Array frame - decode on main thread
                const blob = new Blob([frameData], { type: 'image/jpeg' });
                const bitmap = await createImageBitmap(blob);
                if (bitmap && bitmap.width > 0 && bitmap.height > 0) {
                  if (bitmap.width !== lastBitmapWidth || bitmap.height !== lastBitmapHeight) {
                    canvas.width = bitmap.width;
                    canvas.height = bitmap.height;
                    lastBitmapWidth = bitmap.width;
                    lastBitmapHeight = bitmap.height;
                  }
                  ctx.drawImage(bitmap, 0, 0);
                  lastRenderedTimestamp = Date.now();
                  try { bitmap.close?.(); } catch (e) {}
                }
              }
            } catch (err) {
              console.error('Frame rendering error:', err);
            } finally {
              isRendering = false;
            }
          }

          // Check if canvas is actually updating (not frozen at render level)
          const now = Date.now();
          if (now - lastCanvasUpdateCheck > FROZEN_STATE_TIMEOUT) {
            const timeSinceLastRender = now - lastRenderedTimestamp;
            if (timeSinceLastRender > FROZEN_STATE_TIMEOUT && frameQueue.length === 0) {
              console.warn(`[MJPEGCanvas] Canvas hasn't updated in ${timeSinceLastRender}ms despite stream being open (render frozen), reconnecting...`);
              onStatusChange('offline');
              abortControllerRef.current?.abort();
            }
            lastCanvasUpdateCheck = now;
          }

          if (!signal.aborted) {
            requestAnimationFrame(renderFrame);
          }
        };

        // Start render loop
        requestAnimationFrame(renderFrame);

        // Handle worker messages
        if (workerRef.current) {
          workerRef.current.onmessage = (event) => {
            const { type, frames, fps, bitmap } = event.data;

            if (type === 'bitmap' && bitmap) {
              try {
                // If queue already holds an ImageBitmap, close it to free memory
                const last = frameQueue[frameQueue.length - 1];
                if (last && typeof ImageBitmap !== 'undefined' && last instanceof ImageBitmap) {
                  try { last.close(); } catch (e) {}
                }

                if (frameQueue.length < FRAME_QUEUE_MAX) {
                  frameQueue.push(bitmap);
                } else {
                  frameQueue[frameQueue.length - 1] = bitmap;
                }
              } catch (e) {
                // ignore
              }
            } else if (type === 'frames' && frames) {
              frames.forEach(buffer => {
                try {
                  const newBuf = new Uint8Array(buffer);
                  // Cheap duplicate detection: compare length and first bytes
                  const last = frameQueue[frameQueue.length - 1];
                  if (last && !(typeof ImageBitmap !== 'undefined' && last instanceof ImageBitmap) && last.length === newBuf.length) {
                    let same = true;
                    const cmpLen = Math.min(16, newBuf.length);
                    for (let i = 0; i < cmpLen; i++) {
                      if (last[i] !== newBuf[i]) { same = false; break; }
                    }
                    if (same) return; // skip obvious duplicate
                  }

                  // If last slot contains an ImageBitmap, close it before replacing
                  if (frameQueue.length === FRAME_QUEUE_MAX) {
                    const lastSlot = frameQueue[frameQueue.length - 1];
                    if (lastSlot && typeof ImageBitmap !== 'undefined' && lastSlot instanceof ImageBitmap) {
                      try { lastSlot.close(); } catch (e) {}
                    }
                    frameQueue[frameQueue.length - 1] = newBuf;
                  } else {
                    frameQueue.push(newBuf);
                  }
                } catch (e) {
                  // ignore malformed frame
                }
              });
            } else if (type === 'fps') {
              // console.log(`[MJPEGCanvas] Stream FPS: ${fps}`); // Debug only
            }
          };
        }

        // Main read loop - just forward data to worker
        let frameTimeoutId = null;
        let frozenCheckId = null;
        let readerTimeoutId = null;
        const FRAME_TIMEOUT = 10000; // 10 seconds without ANY data = offline
        const FROZEN_STATE_TIMEOUT = 1500; // 1.5 seconds without NEW frames = frozen, try reconnect
        let lastFrameTimestamp = Date.now();

        const resetFrameTimeout = () => {
          if (frameTimeoutId) clearTimeout(frameTimeoutId);
          
          frameTimeoutId = setTimeout(() => {
            console.error(`[MJPEGCanvas] No data received for ${FRAME_TIMEOUT/1000}s - connection appears dead, aborting`);
            onStatusChange('offline');
            abortControllerRef.current?.abort();
          }, FRAME_TIMEOUT);
        };

        const checkForFrozenState = () => {
          if (frozenCheckId) clearTimeout(frozenCheckId);
          
          frozenCheckId = setTimeout(() => {
            const timeSinceLastFrame = Date.now() - lastFrameTimestamp;
            const isStale = timeSinceLastFrame > FROZEN_STATE_TIMEOUT;
            
            // console.log(`[MJPEGCanvas] Frozen check: elapsed=${timeSinceLastFrame}ms, threshold=${FROZEN_STATE_TIMEOUT}ms, stale=${isStale}`); // Debug only
            
            if (isStale) {
              console.error(`[MJPEGCanvas] ❌ FROZEN DETECTED: No frames for ${(timeSinceLastFrame/1000).toFixed(1)}s - aborting and reconnecting`);
              onStatusChange('offline');
              abortControllerRef.current?.abort();
            } else {
              // Continue checking every FROZEN_STATE_TIMEOUT
              checkForFrozenState();
            }
          }, FROZEN_STATE_TIMEOUT);
        };

        // Race reader.read() against timeout to interrupt hanging reads
        const readWithTimeout = async (reader) => {
          const READ_TIMEOUT = 5000; // 5 seconds - allow slower reads before abort
          
          const timeoutPromise = new Promise((_, reject) => {
            const timeoutId = setTimeout(() => {
              reject(new Error('reader.read() timeout'));
            }, READ_TIMEOUT);
            
            // Store timeout ID so we can clear it if read succeeds
            readWithTimeout._timeoutId = timeoutId;
          });
          
          try {
            return await Promise.race([
              reader.read(),
              timeoutPromise
            ]);
          } finally {
            // Clear timeout if read completed (success or error)
            if (readWithTimeout._timeoutId) {
              clearTimeout(readWithTimeout._timeoutId);
              readWithTimeout._timeoutId = null;
            }
          }
        };

        resetFrameTimeout(); // Start timeout on initial connect
        checkForFrozenState(); // Start frozen state detection
        console.log(`[MJPEGCanvas] Initialized timeouts: FRAME_TIMEOUT=${FRAME_TIMEOUT}ms, FROZEN_STATE_TIMEOUT=${FROZEN_STATE_TIMEOUT}ms`);

        while (true) {
          try {
            const { done, value } = await readWithTimeout(reader);
            
            if (done) {
              console.log(`[MJPEGCanvas] Stream ended (reader.read returned done)`);
              break;
            }

            // Reset timeouts on data received
            resetFrameTimeout();
            lastFrameTimestamp = Date.now();

            // Send data to worker for parsing
            if (workerRef.current) {
              workerRef.current.postMessage({
                type: 'append',
                data: value
              });
            }
          } catch (readerErr) {
            if (readerErr.message === 'reader.read() timeout') {
              console.error(`[MJPEGCanvas] ❌ TIMEOUT: reader.read() hung for 4.8s - stream is dead, reconnecting`);
            } else {
              console.error(`[MJPEGCanvas] Reader error:`, readerErr.message);
            }
            onStatusChange('reconnecting'); // Show overlay while trying to reconnect
            abortControllerRef.current?.abort();
            break;
          }
        }

        if (frameTimeoutId) clearTimeout(frameTimeoutId);
        if (frozenCheckId) clearTimeout(frozenCheckId);
      } catch (err) {
        if (err.name === 'AbortError') {
              // console.log(`[MJPEGCanvas] Stream aborted for camera ${camId}`); // Debug only
          // Attempt reconnect with exponential backoff
          if (componentMounted && retryCount < MAX_RETRIES) {
            const delayMs = BASE_RETRY_DELAY * Math.pow(2, retryCount);
            // console.log(`[MJPEGCanvas] Reconnecting in ${delayMs}ms (attempt ${retryCount + 1}/${MAX_RETRIES})`); // Debug only
            retryCount++;
            onStatusChange('reconnecting'); // Show overlay during reconnect attempt
            setTimeout(() => {
              if (componentMounted) {
                startStreaming();
              }
            }, delayMs);
          } else if (retryCount >= MAX_RETRIES) {
            console.error(`[MJPEGCanvas] Max retries (${MAX_RETRIES}) reached, giving up`);
            onStatusChange('offline'); // Now show "Camera Offline"
          }
        } else {
          console.error(`[MJPEGCanvas] Camera ${camId} streaming error:`, err);
          onStatusChange('reconnecting'); // Show overlay during reconnect
          // Retry on other errors too
          if (componentMounted && retryCount < MAX_RETRIES) {
            const delayMs = BASE_RETRY_DELAY * Math.pow(2, retryCount);
            console.log(`[MJPEGCanvas] Reconnecting in ${delayMs}ms (attempt ${retryCount + 1}/${MAX_RETRIES})`);
            retryCount++;
            setTimeout(() => {
              if (componentMounted) {
                startStreaming();
              }
            }, delayMs);
          }
        }
      }
    };

    startStreaming();

    return () => {
      componentMounted = false;
      if (abortControllerRef.current) {
        // console.log(`[MJPEGCanvas] Cleaning up camera ${camId} stream`); // Debug only
        abortControllerRef.current.abort();
      }
      if (workerRef.current) {
        workerRef.current.terminate();
      }
    };
  }, [camId, onStatusChange]);

  return (
    <canvas
      ref={canvasRef}
      className="block max-w-full max-h-full"
      style={{ display: 'block', backgroundColor: '#000', width: 'auto', height: 'auto', maxWidth: '100%', maxHeight: '100%' }}
    />
  );
}

export default MJPEGCanvas;
