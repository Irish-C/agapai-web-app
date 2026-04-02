import React, { useState, useEffect, useRef, memo } from 'react';
// Utility to check if running in development
const isDev = typeof process !== 'undefined' && process.env && process.env.NODE_ENV !== 'production';
import { FaExpand, FaTimes, FaCamera } from 'react-icons/fa';
import MJPEGCanvas from './components/Video/MJPEGCanvas.jsx';
import { useCameraStream, useObjectDetection, useCameraSubscription } from './hooks/index.js';


function VideoFeed({
  camId,
  cameraName,
  location,
  isFocused,
  onFocusChange,
  streamUrl
}) {
  const [currentDateTime, setCurrentDateTime] = useState(new Date());
  const [noDisplay, setNoDisplay] = useState(() => {
    try {
      return localStorage.getItem(`camera_${camId}_no_display`) === '1';
    } catch (e) { return false; }
  });
  const wrapperRef = useRef(null);

  // Dev/test mode toggle
  const [devMode, setDevMode] = useState(() => {
    try {
      return localStorage.getItem('camera_dev_mode') === '1';
    } catch (e) { return false; }
  });
  // Overlay toggle (can be separated if needed)
  const [overlayEnabled, setOverlayEnabled] = useState(true);

  // Persist dev mode toggle
  useEffect(() => {
    try {
      localStorage.setItem('camera_dev_mode', devMode ? '1' : '0');
    } catch (e) {}
  }, [devMode]);

  // Update date/time every second
  useEffect(() => {
    const timer = setInterval(() => setCurrentDateTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Custom hooks for heavy lifting
  // --- Updated: useCameraStream returns status ---
  const { streamMode, videoRef, status: cameraStatus, setStatus: setCameraStatus } = useCameraStream(streamUrl, camId);

  const { detections, confidenceThreshold, setConfidenceThreshold, lastDetectionAt } = useObjectDetection(
    videoRef,
    wrapperRef,
    streamMode,
    noDisplay,
    camId
  );

  // Only set error via subscription if needed (optional, can be removed if all status is unified in hook)
  useCameraSubscription(camId, (status) => {
    if (status === 'error' && typeof setCameraStatus === 'function') {
      setCameraStatus('error');
    }
  });

  let content;
  let statusMessage = 'Connecting...';
  let statusColor = 'text-yellow-400';

  // Save a flattened snapshot (video frame + overlay) as a single JPEG.
  // Skip capturing when using MJPEG to avoid the expensive per-frame canvas reads.
  const saveFlattenedSnapshot = async () => {
    if (streamMode === 'mjpeg') {
      // Skip MJPEG captures to avoid extra decode/copy overhead on client
      return null;
    }

    const container = wrapperRef.current;
    const videoEl = videoRef.current;
    if (!container) return null;

    // Pick the source element: prefer video for WebRTC/HLS
    let sourceEl = null;
    if (videoEl && (streamMode === 'webrtc' || streamMode === 'hls')) {
      sourceEl = videoEl;
    } else {
      sourceEl = container.querySelector('canvas');
    }
    if (!sourceEl) return null;

    const srcWidth = sourceEl.videoWidth || sourceEl.naturalWidth || sourceEl.width || sourceEl.offsetWidth;
    const srcHeight = sourceEl.videoHeight || sourceEl.naturalHeight || sourceEl.height || sourceEl.offsetHeight;
    if (!srcWidth || !srcHeight) return null;

    const exportCanvas = document.createElement('canvas');
    exportCanvas.width = srcWidth;
    exportCanvas.height = srcHeight;
    const ctx = exportCanvas.getContext('2d');

    try {
      ctx.drawImage(sourceEl, 0, 0, srcWidth, srcHeight);
    } catch (e) {
      console.error('drawImage failed', e);
      return null;
    }

    // Draw detections (normalized coords expected)
    if (overlayEnabled && Array.isArray(detections)) {
      const fontSize = Math.max(12, Math.round(srcWidth / 100));
      ctx.font = `${fontSize}px sans-serif`;
      ctx.textBaseline = 'top';
      detections.forEach(det => {
        const [nx, ny, nw, nh] = det.box || [0,0,0,0];
        const x = Math.round(nx * srcWidth);
        const y = Math.round(ny * srcHeight);
        const w = Math.round(nw * srcWidth);
        const h = Math.round(nh * srcHeight);

        ctx.strokeStyle = '#00ff00';
        ctx.lineWidth = Math.max(2, Math.round(srcWidth / 400));
        ctx.strokeRect(x, y, w, h);

        const label = `${det.label} ${Math.round((det.confidence||0) * 100)}%`;
        const padding = 4;
        const textWidth = Math.ceil(ctx.measureText(label).width) + padding * 2;
        const textHeight = fontSize + 4;
        ctx.fillStyle = 'rgba(0,255,0,0.85)';
        ctx.fillRect(x, Math.max(0, y - textHeight), textWidth, textHeight);
        ctx.fillStyle = '#000';
        ctx.fillText(label, x + padding, Math.max(0, y - textHeight + 2));
      });
    }

    // Trigger download of merged JPEG
    return new Promise((resolve) => {
      exportCanvas.toBlob((blob) => {
        if (!blob) return resolve(null);
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `snapshot_${camId || 'camera'}_${Date.now()}.jpg`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(url);
        resolve(blob);
      }, 'image/jpeg', 0.9);
    });
  };


  if (cameraStatus === 'reconnecting') {
    statusMessage = 'Reconnecting...';
    statusColor = 'text-yellow-400';
  } else if (cameraStatus === 'offline') {
    statusMessage = 'Camera Offline';
    statusColor = 'text-red-400';
  } else if (cameraStatus === 'error') {
    statusMessage = 'Camera Error';
    statusColor = 'text-red-400';
  } else if (cameraStatus === 'online') {
    statusMessage = 'Online';
    statusColor = 'text-green-400';
  }

  if (noDisplay) {
    content = (
      <div className="w-full h-full flex items-center justify-center bg-black text-white">
        <div className="text-center">
          <div className="text-2xl font-semibold mb-2">No display</div>
          <div className="text-sm text-gray-300">Stream configuration is invalid or media server unavailable.</div>
        </div>
      </div>
    );
  } else {
    // Render preferred stream: WebRTC/HLS uses <video>, otherwise MJPEGCanvas
    content = (
      <>
        {streamMode === 'webrtc' || streamMode === 'hls' ? (
          <video
            ref={videoRef}
            className="block max-w-full max-h-full"
            style={{ display: 'block', backgroundColor: '#000', width: 'auto', height: 'auto', maxWidth: '100%', maxHeight: '100%' }}
            playsInline
            muted
            controls={false}
          />
        ) : (
          // MJPEG Stream using fetch for better compatibility
          <MJPEGCanvas
            camId={camId}
            cameraName={cameraName}
            onStatusChange={setCameraStatus}
          />
        )}
        {/* Detections overlay (normalized coords 0..1) */}
        <div className="absolute inset-0 pointer-events-none">
          {detections.filter(d => (d.confidence || 0) >= confidenceThreshold).map((det, idx) => {
            const box = det.box || [0,0,0,0];
            const left = `${(box[0] * 100).toFixed(4)}%`;
            const top = `${(box[1] * 100).toFixed(4)}%`;
            const width = `${(box[2] * 100).toFixed(4)}%`;
            const height = `${(box[3] * 100).toFixed(4)}%`;
            return (
              <div key={idx} style={{ position: 'absolute', left, top, width, height }}>
                <div style={{ position: 'absolute', inset: 0, border: '2px solid #00ff00', boxSizing: 'border-box' }} />
                <div style={{ position: 'absolute', left: 0, top: 0, backgroundColor: 'rgba(0,255,0,0.85)', color: '#000', padding: '2px 6px', fontSize: '12px', fontFamily: 'sans-serif' }}>
                  {det.label} {Math.round((det.confidence || 0) * 100)}%
                </div>
              </div>
            );
          })}
        </div>
      </>
    );
  }

  return (
    <div
      ref={wrapperRef}
      className={`group bg-black rounded-none shadow-md overflow-hidden border-2 border-gray-700 relative ${
        !isFocused ? 'cursor-pointer hover:border-teal-500 transition-all' : 'border-teal-600'
      }`}
      onClick={() => !isFocused && onFocusChange?.(camId)}
    >
      {/* Header Bar */}
      <div className="absolute top-0 left-0 w-full text-white p-2 flex items-center justify-between z-10">
        <div className="flex items-center gap-2 overflow-hidden min-w-0">
          <h4 className="font-semibold text-sm truncate">{cameraName}</h4>
          <p className="text-xs text-gray-400 truncate font-normal">{location}</p>
        </div>
        {/* Save snapshot button + Status Indicator */}
        <div className="flex items-center gap-2">
          <button
            onClick={(e) => { e.stopPropagation(); saveFlattenedSnapshot(); }}
            className="p-1 bg-black/40 rounded text-white hover:bg-black/60"
            title="Save snapshot"
          >
            <FaCamera />
          </button>
          <span className={`w-2 h-2 rounded-full ${
            cameraStatus === 'online' ? 'bg-green-500' :
            cameraStatus === 'offline' ? 'bg-red-500' :
            cameraStatus === 'error' ? 'bg-red-600' :
            cameraStatus === 'reconnecting' ? 'bg-yellow-500 animate-pulse' :
            'bg-yellow-500'
          }`}></span>
        </div>
      </div>

      {/* Video Area */}
      <div
        className={`w-full bg-gray-900 flex items-center justify-center relative ${
          isFocused ? '' : 'aspect-video'
        }`}
        style={isFocused ? { width: '100%', height: 'calc(100vh - 6rem)', maxHeight: 'calc(100vh - 6rem)' } : {}}
      >
        {/* Loading overlay: only show if not online and not noDisplay */}
        {(!noDisplay && cameraStatus !== 'online') && (
          <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-black/70 text-white">
            <div className="text-lg font-semibold mb-2">{statusMessage}</div>
            <div className="w-8 h-8 border-4 border-t-transparent border-yellow-400 rounded-full animate-spin mb-2" />
          </div>
        )}
        {content}

        {/* CCTV Timestamp Overlay */}
        <div className="absolute bottom-2 left-2 bg-transparent text-white px-3 py-1 rounded text-xs font-mono">
          <div>DATE: {currentDateTime.toLocaleDateString()} {currentDateTime.toLocaleTimeString()}</div>
        </div>

        {/* Focus/Unfocus Button */}
        {isFocused ? (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onFocusChange?.(null);
            }}
            className="absolute top-2 right-2 p-2 bg-black/60 rounded-full text-white hover:bg-red-600 transition-colors z-20"
            title="Return to Grid"
          >
            <FaTimes />
          </button>
        ) : (
          <div
            className="absolute top-2 right-2 p-2 bg-black/60 rounded-full text-white opacity-0 group-hover:opacity-100 transition-opacity z-20"
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