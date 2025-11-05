import React from 'react';
// Import icons for status messages
import { FaVideo, FaVideoSlash, FaSpinner } from 'react-icons/fa';

/**
 * Renders a single camera feed box.
 * Receives props from CameraGrid.jsx
 */
export default function VideoFeed({ camId, location, frameData, isConnected }) {
  
  let content;
  if (!isConnected) {
    // WebSocket is globally disconnected
    content = (
      <div className="flex flex-col items-center justify-center h-full text-red-500">
        <FaVideoSlash className="text-4xl mb-2" />
        <span>Disconnected</span>
      </div>
    );
  } else if (!frameData) {
    // WebSocket is connected, but no frame received for *this* camera yet
    content = (
      <div className="flex flex-col items-center justify-center h-full text-gray-500">
        <FaSpinner className="animate-spin text-4xl mb-2" />
        <span>Connecting...</span>
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

  return (
    <div className="bg-black rounded-lg shadow-lg overflow-hidden border-2 border-gray-700">
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

      {/* Video Area (maintains 16:9 aspect ratio) */}
      <div className="aspect-video w-full bg-gray-900 flex items-center justify-center">
        {content}
      </div>
    </div>
  );
}