import React, { useState, useEffect } from 'react';
import { FaExpand, FaTimes } from 'react-icons/fa';
import { socket } from '../../services/socket.js';

export default function VideoFeed({
  camId,
  cameraName,
  location,
  frameData,
  isFocused,
  onFocusChange
}) {
  const [currentDateTime, setCurrentDateTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentDateTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Subscribe to camera frame stream
  useEffect(() => {
    try {
      socket.emit('subscribe_camera', { camera_id: camId });
    } catch (e) {
      console.warn(`Failed to subscribe to camera ${camId}:`, e);
    }

    return () => {
      // Unsubscribe when component unmounts
      try {
        socket.emit('unsubscribe_camera', { camera_id: camId });
      } catch (e) {}
    };
  }, [camId]);

  const hasFrame = !!frameData;

  let content;
  if (!hasFrame) {
    content = (
      <div className="flex flex-col items-center justify-center h-full text-gray-500">
        <svg className="animate-spin h-12 w-12 mb-2" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        <span>Connecting...</span>
      </div>
    );
  } else {
    content = (
      <img
        src={`data:image/jpeg;base64,${frameData}`}
        alt={`${cameraName} Feed`}
        className="w-full h-full object-contain"
      />
    );
  }

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
        <span className={`w-2 h-2 rounded-full ${hasFrame ? 'bg-green-500' : 'bg-red-500'}`}></span>
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
