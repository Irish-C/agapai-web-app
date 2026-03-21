import { useState, useEffect, useRef, memo } from 'react';
import { FaExpand, FaTimes } from 'react-icons/fa';
import { socket, addSubscribedCamera, removeSubscribedCamera } from '../../services/socket.js';

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
        new URL('./mjpegParser.worker.js', import.meta.url)
      );
    } catch (err) {
      console.error('[MJPEGCanvas] Failed to create worker:', err);
    }

    let retryCount = 0;
    const MAX_RETRIES = 10;
    const BASE_RETRY_DELAY = 300; // 300ms - faster reconnection attempts
    let componentMounted = true;

    const startStreaming = async () => {
      if (!componentMounted) return;

      // Create a FRESH AbortController for each attempt
      abortControllerRef.current = new AbortController();
      const signal = abortControllerRef.current.signal;

      try {
        onStatusChange('connecting');
        console.log(`[MJPEGCanvas] Starting stream for camera ${camId}`);
        
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

        console.log(`[MJPEGCanvas] Connected to stream, content-type: ${response.headers.get('content-type')}`);
        onStatusChange('online');
        retryCount = 0; // Reset retry count on success
        const reader = response.body?.getReader();
        if (!reader) throw new Error('No stream reader');

        const frameQueue = [];
        let isRendering = false;
        let lastRenderedTimestamp = Date.now();
        let lastCanvasUpdateCheck = Date.now();

        // Rendering loop using requestAnimationFrame
        const renderFrame = () => {
          if (frameQueue.length > 0 && canvas.offsetParent) {
            const frameData = frameQueue.shift();
            
            try {
              const blob = new Blob([frameData], { type: 'image/jpeg' });
              const url = URL.createObjectURL(blob);
              const img = new Image();

              img.onload = () => {
                if (img.width > 0 && img.height > 0) {
                  canvas.width = img.width;
                  canvas.height = img.height;
                  ctx.drawImage(img, 0, 0);
                  lastRenderedTimestamp = Date.now(); // Track successful render
                }
                URL.revokeObjectURL(url);
              };

              img.onerror = () => {
                URL.revokeObjectURL(url);
              };

              img.src = url;
            } catch (err) {
              console.error('Frame rendering error:', err);
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
            const { type, frames, fps } = event.data;
            
            if (type === 'frames' && frames) {
              frames.forEach(buffer => {
                if (frameQueue.length < 15) {
                  frameQueue.push(new Uint8Array(buffer));
                }
              });
            } else if (type === 'fps') {
              console.log(`[MJPEGCanvas] Stream FPS: ${fps}`);
            }
          };
        }

        // Main read loop - just forward data to worker
        let frameTimeoutId = null;
        let frozenCheckId = null;
        let readerTimeoutId = null;
        const FRAME_TIMEOUT = 5000; // 5 seconds without ANY data = offline
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
            
            console.log(`[MJPEGCanvas] Frozen check: elapsed=${timeSinceLastFrame}ms, threshold=${FROZEN_STATE_TIMEOUT}ms, stale=${isStale}`);
            
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
          const READ_TIMEOUT = 2000; // 2 seconds
          
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
          console.log(`[MJPEGCanvas] Stream aborted for camera ${camId}`);
          // Attempt reconnect with exponential backoff
          if (componentMounted && retryCount < MAX_RETRIES) {
            const delayMs = BASE_RETRY_DELAY * Math.pow(2, retryCount);
            console.log(`[MJPEGCanvas] Reconnecting in ${delayMs}ms (attempt ${retryCount + 1}/${MAX_RETRIES})`);
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
        console.log(`[MJPEGCanvas] Cleaning up camera ${camId} stream`);
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
      className="w-full h-full"
      style={{ display: 'block', backgroundColor: '#000', maxWidth: '100%', maxHeight: '100%' }}
    />
  );
}

function VideoFeed({
  camId,
  cameraName,
  location,
  isFocused,
  onFocusChange
}) {
  const [currentDateTime, setCurrentDateTime] = useState(new Date());
  const [cameraStatus, setCameraStatus] = useState('connecting'); // connecting, online, offline, error
  const subscriptionRef = useRef(null); // Track if subscribed to prevent duplicate subscribe calls

  useEffect(() => {
    const timer = setInterval(() => setCurrentDateTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Subscribe to camera status updates (for connection status indicator)
  useEffect(() => {
    // Only subscribe if not already subscribed
    if (subscriptionRef.current === camId) {
      return; // Already subscribed to this camera
    }

    subscriptionRef.current = camId;
    
    // Track subscription for auto-resubscribe on reconnect
    addSubscribedCamera(camId);
    const authToken = localStorage.getItem('authToken');

    try {
      socket.emit('subscribe_camera', { camera_id: camId, token: authToken });
    } catch (e) {
      console.warn(`Failed to subscribe to camera ${camId}:`, e);
      subscriptionRef.current = null;
    }

    // Listen for camera status events (only for critical errors, don't override local MJPEG status)
    const handleCameraStatus = (data) => {
      if (data.cam_id === String(camId)) {
        // Only override if it's a critical error, otherwise trust MJPEG stream status
        if (data.status === 'error') {
          setCameraStatus('error');
        }
        // For 'offline' from backend, only set if MJPEG hasn't connected yet
        // If MJPEG is streaming, that's more reliable than backend status
      }
    };

    socket.on('camera_status', handleCameraStatus);

    return () => {
      // Unsubscribe when component unmounts
      try {
        socket.emit('unsubscribe_camera', { camera_id: camId, token: authToken });
      } catch (e) {}
      removeSubscribedCamera(camId);
      socket.off('camera_status', handleCameraStatus);
      subscriptionRef.current = null;
    };
  }, [camId]);

  let content;
  let statusMessage = 'Connecting...';
  let statusColor = 'text-yellow-400';
  
  if (cameraStatus === 'reconnecting') {
    statusMessage = 'Reconnecting...';
    statusColor = 'text-yellow-400';
  } else if (cameraStatus === 'offline') {
    statusMessage = 'Camera Offline';
    statusColor = 'text-red-400';
  } else if (cameraStatus === 'error') {
    statusMessage = 'Camera Error';
    statusColor = 'text-red-400';
  }

  content = (
    <>
      {/* MJPEG Stream using fetch for better compatibility */}
      <MJPEGCanvas
        camId={camId}
        cameraName={cameraName}
        onStatusChange={setCameraStatus}
      />
      
      {/* Loading/Error overlay (only visible when MJPEG is not connecting) */}
      {cameraStatus !== 'online' && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/70">
          <svg className="animate-spin h-12 w-12 mb-2 text-gray-500" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <span className={statusColor}>{statusMessage}</span>
        </div>
      )}
    </>
  );

  return (
    <div
      className={`group bg-black rounded-lg shadow-lg overflow-hidden border-2 border-gray-700 relative ${
        !isFocused ? 'cursor-pointer hover:border-teal-500 transition-all' : 'border-teal-600'
      }`}
      onClick={() => !isFocused && onFocusChange?.(camId)}
    >
      {/* Header Bar */}
      <div className="bg-gray-800 text-white p-2 flex items-center justify-between">
        <div className="flex flex-col overflow-hidden">
          <h4 className="font-semibold text-sm truncate">{cameraName}</h4>
          <p className="text-xs text-gray-400 truncate">{location}</p>
        </div>
        {/* Status Indicator Dot */}
        <span className={`w-2 h-2 rounded-full ${
          cameraStatus === 'online' ? 'bg-green-500' :
          cameraStatus === 'offline' ? 'bg-red-500' :
          cameraStatus === 'error' ? 'bg-red-600' :
          cameraStatus === 'reconnecting' ? 'bg-yellow-500 animate-pulse' :
          'bg-yellow-500'
        }`}></span>
      </div>

      {/* Video Area */}
      <div
        className={`w-full bg-gray-900 flex items-center justify-center relative ${
          isFocused ? 'h-[75vh]' : 'aspect-video'
        }`}
      >
        {content}

        {/* CCTV Timestamp Overlay */}
        <div className="absolute bottom-2 left-2 bg-black/60 text-white px-3 py-1 rounded text-xs font-mono backdrop-blur-sm">
          <div>{currentDateTime.toLocaleDateString()}</div>
          <div>{currentDateTime.toLocaleTimeString()}</div>
        </div>

        {/* Focus/Unfocus Button */}
        {isFocused ? (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onFocusChange?.(null);
            }}
            className="absolute top-2 right-2 p-2 bg-black/60 rounded-full text-white hover:bg-red-600 transition-colors"
            title="Return to Grid"
          >
            <FaTimes />
          </button>
        ) : (
          <div
            className="absolute top-2 right-2 p-2 bg-black/60 rounded-full text-white opacity-0 group-hover:opacity-100 transition-opacity"
            title="Focus"
          >
            <FaExpand />
          </div>
        )}
      </div>
    </div>
  );
}

export default memo(VideoFeed);
