import React, { useState, useEffect } from 'react';
import { io } from 'socket.io-client';
import VideoFeed from './VideoFeed.jsx';
// Import the component that will display the real-time incident log
// (Assuming you have a placeholder component for the sidebar)
import TodayReport from './TodayReport.jsx'; 
import ErrorBoundary from './ErrorBoundary';

// Inside render:
<ErrorBoundary>
  <VideoFeed 
    key={camera.id} 
    socket={socket} 
    camera_id={camera.id} 
    location={camera.location} 
  />
</ErrorBoundary>

// --- CONFIGURATION ---
// IMPORTANT: Use the actual IP address of your central server/RPi if running on separate machines
const SOCKET_SERVER_URL = 'http://localhost:5000'; 
// If your server is running on a different machine, use: 'http://<RPi_IP_ADDRESS>:5000'

export default function CameraGrid({ layout }) {
  const [socket, setSocket] = useState(null);
  const [incidents, setIncidents] = useState([]); // State to hold real-time alerts

  // --- 1. Establish WebSocket Connection and Listeners ---
  useEffect(() => {
    const newSocket = io(SOCKET_SERVER_URL, {
      reconnectionAttempts: 5,
      timeout: 10000,
      transports: ['websocket', 'polling']
    });

    newSocket.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
      setStatus('Connection error');
    });

    // 2. Listener for INSTANT ALERTS (from FuzzyLogic)
    newSocket.on('incident_alert', (alertData) => {
      console.warn(`WS: New CRITICAL INCIDENT: ${alertData.message}`);
      // Add the new incident to the top of the list
      setIncidents(prev => [alertData, ...prev]); 
      // This state update will feed into the TodayReport sidebar
    });

    newSocket.on('disconnect', () => {
      console.error('WS: Disconnected from Flask.');
    });

    // Cleanup: Disconnect when the component is removed
    return () => {
      newSocket.disconnect();
    };
  }, []); 

  // Wait until the socket is connected before rendering feeds
  if (!socket) {
    return <div className="text-center p-8 text-lg">Establishing connection to central server...</div>;
  }

  // --- 2. Render Layout based on 'layout' Prop ---
  const cameras = [
    { id: 'cam1', location: 'Living Room' }, 
    { id: 'cam2', location: 'Hallway' },
    { id: 'cam3', location: 'Bedroom A' },
    { id: 'cam4', location: 'Bedroom B' }
  ];

  const gridClass = layout === '2x2 Grid' ? 'grid-cols-2' : 'grid-cols-1';

  return (
    <div className="flex space-x-4">
      
      {/* Left Side: Video Feeds */}
      <div className={`w-3/4 grid gap-4 ${gridClass}`}>
        {cameras.map(camera => (
          // Pass the socket to each feed, so it can listen for its specific frames
          <VideoFeed 
            key={camera.id} 
            socket={socket} 
            camera_id={camera.id} 
            location={camera.location} 
          />
        ))}
      </div>

      {/* Right Side: Incident Log */}
      <div className="w-1/4">
        {/* Pass the incident state down to your sidebar component */}
        <TodayReport incidents={incidents} /> 
      </div>
    </div>
  );
}