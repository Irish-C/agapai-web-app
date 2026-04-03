import React, { useState, useEffect, useRef, memo } from 'react';
// Utility to check if running in development
const isDev = typeof process !== 'undefined' && process.env && process.env.NODE_ENV !== 'production';
import { FaExpand, FaTimes, FaCamera } from 'react-icons/fa';
// Streaming implementations removed; UI scaffolding retained.


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

  // Update date/time every second
  useEffect(() => {
    const timer = setInterval(() => setCurrentDateTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Streaming removed: provide a minimal videoRef for potential future use
  const videoRef = useRef(null);
  const cameraStatus = 'disabled';

  let content;
  let statusMessage = 'Connecting...';
  let statusColor = 'text-yellow-400';

  // Streaming disabled: show a neutral status
  statusMessage = 'Streaming disabled';
  statusColor = 'text-gray-400';

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
    // Show placeholder area where the video would normally render
    content = (
      <div className="w-full h-full flex items-center justify-center bg-black text-white">
        <div className="text-center">
          <div className="text-2xl font-semibold mb-2">Stream Unavailable</div>
          <div className="text-sm text-gray-300">Streaming implementation removed. UI placeholder only.</div>
        </div>
      </div>
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