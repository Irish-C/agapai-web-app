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
    abortControllerRef.current = new AbortController();
    const signal = abortControllerRef.current.signal;

    // Create Web Worker for MJPEG parsing
    try {
      workerRef.current = new Worker(
        new URL('./mjpegParser.worker.js', import.meta.url)
      );
    } catch (err) {
      console.error('[MJPEGCanvas] Failed to create worker:', err);
    }

    const startStreaming = async () => {
      try {
        onStatusChange('connecting');
        console.log(`[MJPEGCanvas] Starting stream for camera ${camId}`);
        
        // Set a connection timeout of 10 seconds
        const connectionTimeoutId = setTimeout(() => {
          if (signal.aborted === false) {
            console.warn(`[MJPEGCanvas] Stream connection timeout after 10s`);
            abortControllerRef.current?.abort();
          }
        }, 10000);

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
        const reader = response.body?.getReader();
        if (!reader) throw new Error('No stream reader');

        const frameQueue = [];
        let isRendering = false;

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
        const FRAME_TIMEOUT = 15000; // 15 seconds without frames = offline

        const resetFrameTimeout = () => {
          if (frameTimeoutId) clearTimeout(frameTimeoutId);
          
          frameTimeoutId = setTimeout(() => {
            console.warn(`[MJPEGCanvas] No frames received for ${FRAME_TIMEOUT/1000}s, marking camera offline`);
            onStatusChange('offline');
            abortControllerRef.current?.abort();
          }, FRAME_TIMEOUT);
        };

        resetFrameTimeout(); // Start timeout on initial connect

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          // Reset timeout on every frame received
          resetFrameTimeout();

          // Send data to worker for parsing
          if (workerRef.current) {
            workerRef.current.postMessage({
              type: 'append',
              data: value
            });
          }
        }

        if (frameTimeoutId) clearTimeout(frameTimeoutId);
      } catch (err) {
        if (err.name === 'AbortError') {
          console.log(`[MJPEGCanvas] Stream aborted for camera ${camId}`);
          // Status already set by timeout handler or cleanup
        } else {
          console.error(`[MJPEGCanvas] Camera ${camId} streaming error:`, err);
          onStatusChange('offline');
        }
      }
    };

    startStreaming();

    return () => {
      abortControllerRef.current?.abort();
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

    try {
      socket.emit('subscribe_camera', { camera_id: camId });
    } catch (e) {
      console.warn(`Failed to subscribe to camera ${camId}:`, e);
      subscriptionRef.current = null;
    }

    // Listen for camera status events
    const handleCameraStatus = (data) => {
      if (data.cam_id === String(camId)) {
        setCameraStatus(data.status);
      }
    };

    socket.on('camera_status', handleCameraStatus);

    return () => {
      // Unsubscribe when component unmounts
      try {
        socket.emit('unsubscribe_camera', { camera_id: camId });
      } catch (e) {}
      removeSubscribedCamera(camId);
      socket.off('camera_status', handleCameraStatus);
      subscriptionRef.current = null;
    };
  }, [camId]);

  let content;
  let statusMessage = 'Connecting...';
  let statusColor = 'text-yellow-400';
  
  if (cameraStatus === 'offline') {
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
