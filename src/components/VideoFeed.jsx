import React, { useState, useEffect, useRef } from 'react';
import { FaHeartbeat } from 'react-icons/fa'; // Assuming you installed react-icons

export default function VideoFeed({ socket, camera_id, location }) {
  const [imageSrc, setImageSrc] = useState(null);
  const [status, setStatus] = useState('Connecting...');

  // --- Listener for Video Frames ---
  useEffect(() => {
    if (!socket) return;
    
    // Listen for the 'video_frame' event
    socket.on('video_frame', (data) => {
      // Check if the frame belongs to THIS specific camera
      if (data.camera_id === camera_id) { 
        setImageSrc(`data:image/jpeg;base64,${data.image}`);
        setStatus('Live');
      }
    });

    // Cleanup listener on unmount
    return () => {
      socket.off('video_frame');
    };
  }, [socket, camera_id]); 

  // Render the video feed
  return (
    <div 
      className="bg-black rounded-lg shadow-xl flex items-center justify-center relative overflow-hidden"
      style={{ minHeight: '300px' }}
    >
      {imageSrc ? (
        <img 
          src={imageSrc} 
          alt={`Live feed from ${location}`} 
          className="w-full h-full object-cover"
        />
      ) : (
        <span className="text-white text-sm">{status}</span>
      )}

      {/* Status Overlay */}
      <div className="absolute bottom-0 left-0 right-0 p-2 bg-black bg-opacity-70 text-white flex justify-between items-center">
        <span className="font-semibold">{location}</span>
        <div className={`text-sm font-medium flex items-center text-green-400`}>
          <FaHeartbeat className="mr-1" />
          {status}
        </div>
      </div>
    </div>
  );
}