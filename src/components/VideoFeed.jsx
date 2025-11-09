import React from 'react';
import { FaVideo, FaVideoSlash, FaSpinner, FaTimes, FaExpand } from 'react-icons/fa';

/**
 * Renders a single camera feed box.
 * Receives props from CameraGrid.jsx
 */
export default function VideoFeed({ 
  camId, 
  location, 
  frameData, 
  isConnected, 
  isFocused, 
  onFocusChange 
}) {
  
  let content;
  if (!isConnected) {
    // WebSocket is globally disconnected
    content = (
      <div className="flex flex-col items-center justify-center h-full text-red-500">
        <FaVideoSlash className="text-4xl mb-2" />
        <span>Disconnected</span>
      </div>
    );
  } else if (!frameData && !isFocused) { // Don't show spinner if focused and no data yet, it's distracting
    // WebSocket is connected, but no frame received for *this* camera yet
    content = (
      <div className="flex flex-col items-center justify-center h-full text-gray-500">
        <FaSpinner className="animate-spin text-4xl mb-2" />
        <span>Connecting...</span>
      </div>
    );
  } else if (!frameData && isFocused) {
    // Focused, but no data
     content = (
      <div className="flex flex-col items-center justify-center h-full text-gray-500">
        <FaVideo className="text-4xl mb-2" />
        <span>Waiting for video stream...</span>
      </div>
    );
  } else {
    // We have data! Show the image from the base64 string.
    content = (
      <img 
        src={`data:image/jpeg;base64,${frameData}`} 
        alt={`${location} Feed`}
        className="w-full h-full object-cover"
      />
    );
  }

  // Handle click:
  // - If not focused, clicking sets focus to this camera.
  // - If focused, this click is ignored (only the 'X' button works).
  const handleFocusClick = () => {
    if (!isFocused) {
      onFocusChange(camId);
    }
  };

  return (
    <div 
      className={`group bg-black rounded-lg shadow-lg overflow-hidden border-2 border-gray-700 relative 
        ${!isFocused ? 'cursor-pointer hover:border-teal-500 transition-all' : 'border-teal-600'}
      `}
      onClick={handleFocusClick}
    >
      {/* Header Bar */}
      <div className="bg-gray-800 text-white p-2 flex items-center justify-between">
        <h4 className="font-semibold text-sm truncate">
          <FaVideo className="inline-block mr-2 text-teal-400" />
          {location}
        </h4>
        {/* Status light */}
        <span 
          title={frameData && isConnected ? 'Live' : 'Offline'}
          className={`w-3 h-3 rounded-full transition-colors ${
            frameData && isConnected ? 'bg-green-500' : 'bg-red-500'
          }`}
        ></span>
      </div>

      {/* Video Area: changes height if focused */}
      <div 
        className={`w-full bg-gray-900 flex items-center justify-center relative
          ${isFocused ? 'h-[75vh]' : 'aspect-video'}
        `}
      >
        {content}

        {/* --- Focus/Unfocus Buttons --- */}
        {isFocused ? (
          // "Return to Grid" button (visible only when focused)
          <button
              onClick={(e) => {
                e.stopPropagation(); // Stop click from bubbling to the main div
                onFocusChange(null); // Pass null to reset focus
              }}
              className="absolute top-2 right-2 p-2 bg-black/60 rounded-full text-white hover:bg-red-600 transition-colors"
              title="Return to Grid"
          >
              <FaTimes />
          </button>
        ) : (
          // "Focus" icon (visible on hover when in grid)
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