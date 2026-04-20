import React, { useState, useEffect, useRef, memo } from 'react';
import { FaBrain } from 'react-icons/fa';

function VideoFeed({ camId, cameraName, location, streamUrl, rtspUrl }) {
  const [currentDateTime, setCurrentDateTime] = useState(new Date());
  const [noDisplay, setNoDisplay] = useState(() => {
    try { return localStorage.getItem(`camera_${camId}_no_display`) === '1'; } catch (e) { return false; }
  });
  const [streamError, setStreamError] = useState(false);

  const wrapperRef = useRef(null);
  const imgRef = useRef(null);

  useEffect(() => {
    const timer = setInterval(() => setCurrentDateTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Set up stream from Flask AI service
  useEffect(() => {
    if (!streamUrl) return;

    const handleError = () => {
      setStreamError(true);
      // Retry after 5 seconds if stream fails
      const timer = setTimeout(() => {
        // Try to reconnect by triggering a reload
        if (imgRef.current && imgRef.current.src) {
          imgRef.current.src = streamUrl + `&t=${Date.now()}`;
        }
      }, 5000);
      return () => clearTimeout(timer);
    };

    // Set error handler
    if (imgRef.current) {
      imgRef.current.addEventListener('error', handleError);
      imgRef.current.addEventListener('load', () => setStreamError(false));
    }

    return () => {
      if (imgRef.current) {
        imgRef.current.removeEventListener('error', handleError);
        imgRef.current.removeEventListener('load', () => setStreamError(false));
      }
    };
  }, [streamUrl]);

  const cameraStatus = streamUrl && !streamError ? 'online' : 'offline';

  let content = null;

  if (noDisplay) {
    content = (
      <div className="w-full h-full flex items-center justify-center bg-black text-white">
        <div className="text-center">
          <div className="text-2xl font-semibold mb-2">No display</div>
          <div className="text-sm text-gray-300">Stream configuration is invalid or media server unavailable.</div>
        </div>
      </div>
    );
  } else if (streamUrl && !streamError) {
    // MJPEG stream from AI service - use img tag for MJPEG support
    content = (
      <img
        ref={imgRef}
        className="w-full h-full object-contain"
        src={streamUrl}
        alt={cameraName}
        onError={() => setStreamError(true)}
        onLoad={() => setStreamError(false)}
      />
    );
  } else {
    // Stream unavailable or error
    content = (
      <div className="w-full h-full flex items-center justify-center bg-black text-white">
        <div className="text-center">
          <div className="text-2xl font-semibold mb-2">Stream Unavailable</div>
          <div className="text-sm text-gray-300">{streamError ? 'AI service connection failed' : 'No stream URL configured for this camera.'}</div>
        </div>
      </div>
    );
  }

  return (
    <div ref={wrapperRef} className="group bg-black rounded-none shadow-md overflow-hidden border-2 border-gray-700 relative">
      <div className="absolute top-0 left-0 w-full text-white p-2 flex items-center justify-between z-10">
        <div className="flex items-center gap-2 overflow-hidden min-w-0">
        </div>
        <div className="flex items-center gap-2">
          <span className={`w-2 h-2 rounded-full ${cameraStatus === 'online' ? 'bg-green-500' : 'bg-red-500'}`}></span>
        </div>
      </div>

      <div className="w-full bg-gray-900 flex items-center justify-center relative overflow-hidden aspect-video">
        {(!noDisplay && cameraStatus !== 'online') && (
          <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-black/70 text-white">
            <div className="text-lg font-semibold mb-2">{cameraStatus === 'online' ? 'Online' : 'Offline'}</div>
            <div className="w-8 h-8 border-4 border-t-transparent border-yellow-400 rounded-full animate-spin mb-2" />
          </div>
        )}

        {content}

        <div className="absolute bottom-2 left-2 text-white px-2 py-1 rounded text-xs font-mono">
          <div className="flex gap-1 mb-0.5">
            <div className="font-semibold text-sm px-1 py-0.5 rounded" style={{ color: '#ffffff', backgroundColor: 'rgba(0, 0, 0, 0.3)' }}>{cameraName}</div>
            <div className="text-xs px-1 py-0.5 rounded" style={{ color: '#ffffff', backgroundColor: 'rgba(0, 0, 0, 0.3)' }}>{location}</div>
          </div>
          <div className="text-xs px-1 py-0.5 rounded" style={{ color: '#ffffff', backgroundColor: 'rgba(0, 0, 0, 0.3)' }}>DATE: {currentDateTime.toLocaleDateString()} {currentDateTime.toLocaleTimeString()}</div>
        </div>

        <div className="absolute top-2 right-2 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity z-20">
          <button onClick={(e) => { e.stopPropagation(); fetch(`/api/cameras/${camId}/publish`, { method: 'POST' }).then(() => window.open('http://localhost:3000', '_blank')).catch(err => console.error('Failed to start AI:', err)); }} className="p-2 bg-green-600/80 rounded-full text-white hover:bg-green-700 transition-colors" title="View AI Detection"><FaBrain /></button>
        </div>
      </div>
    </div>
  );
}

export default memo(VideoFeed);
