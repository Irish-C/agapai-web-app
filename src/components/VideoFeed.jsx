// src/components/VideoFeed.jsx
import React from 'react';
import { 
  FaVideo, 
  FaVideoSlash, 
  FaSpinner, 
  FaTimes, 
  FaExpand,
    FaLink // Added for showing the URL
} from 'react-icons/fa';

/**
 * Renders a single camera feed box.
 * Receives props from CameraGrid.jsx
 */
export default function VideoFeed({ 
  camId, 
  location, 
  streamUrl, 
  frameData, 
  isConnected, 
  isFocused, 
  onFocusChange 
}) {
  
  const hasFrameData = !!frameData;
  const hasStreamUrl = !!streamUrl;

  let content;

  if (isConnected && hasStreamUrl && !hasFrameData) {
    // Case 1: Connected, but the stream is not yet delivering frames (either MJPEG or WebSocket).
    // We display the URL as a debugging placeholder since the camera isn't running.
    content = (
      <div className="p-4 flex flex-col items-center justify-center h-full text-gray-400">
        <FaLink className="text-4xl mb-2" />
        <span className="font-semibold text-sm mb-1">Stream URL Confirmed:</span>
        <a 
          href={streamUrl} 
          target="_blank" 
          rel="noopener noreferrer"
          className="text-xs break-all hover:underline text-teal-400"
        >
          {streamUrl}
        </a>
        <span className="mt-2 text-xs">Waiting for camera server to start streaming...</span>
      </div>
    );
  } else if (!isConnected) {
    // Case 2: WebSocket is globally disconnected
    content = (
      <div className="flex flex-col items-ce+nter justify-center h-full text-red-500">
        <FaVideoSlash className="text-4xl mb-2" />
        <span>Disconnected</span>
      </div>
    );
  } else if (!hasFrameData && !isFocused) {
    // Case 3: WebSocket is connected, but no frame received yet (Grid mode)
    content = (
      <div className="flex flex-col items-center justify-center h-full text-gray-500">
        <FaSpinner className="animate-spin text-4xl mb-2" />
        <span>Connecting...</span>
      </div>
    );
  } else if (!hasFrameData && isFocused) {
    // Case 4: Focused, but no data (to avoid showing a confusing spinner on a big screen)
     content = (
      <div className="flex flex-col items-center justify-center h-full text-gray-500">
        <FaVideo className="text-4xl mb-2" />
        <span>Waiting for video stream...</span>
      </div>
    );
  } else {
    // Case 5: We have data! Show the image from the base64 string.
    content = (
      <img 
//         src={`data:image/jpeg;base64,${frameData}`} 
        style={{ height: '130%', width:'100%' }}
        src={streamUrl} 
        alt={`${location} Feed`}
//         className="w-full h-full object-cover"
      />
    );
  }

  const isLive = hasFrameData && isConnected; // Status check now depends only on receiving frames.

  // Handle click:
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
          title={isLive ? 'Live' : 'Offline'}
          className={`w-3 h-3 rounded-full transition-colors ${
            isLive ? 'bg-green-500' : 'bg-red-500'
          }`}
        ></span>
      </div>

      {/* Video Area: changes height if focused */}
      <div 
        className={`w-full bg-gray-900 flex items-center justify-center relative pt-xl
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