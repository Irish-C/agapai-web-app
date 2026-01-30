// src/components/ConnectionStatus.jsx
import React, { useEffect, useState } from "react";
import { socket } from "../socket";
import { FaPlug } from "react-icons/fa"; 

// Accept the onLogout prop
export default function ConnectionStatus({ onLogout }) {
  const [connected, setConnected] = useState(socket.connected);
  const [isMinimized, setIsMinimized] = useState(false);

  useEffect(() => {
    const handleConnect = () => setConnected(true);
    
    const handleDisconnect = () => {
      setConnected(false);
      
      if (onLogout) {
          console.log("WebSocket disconnected. Initiating forced logout.");
          onLogout(); 
      }
    };

    socket.on("connect", handleConnect);
    socket.on("disconnect", handleDisconnect);

    return () => {
      socket.off("connect", handleConnect);
      socket.off("disconnect", handleDisconnect);
    };
  }, [onLogout]); 

  const toggleMinimize = () => {
    setIsMinimized(prev => !prev);
  };

  const statusColor = connected ? "bg-green-400" : "bg-red-500";
  const statusPulse = connected ? "animate-pulse" : "";
  const statusText = connected ? "Connected" : "Disconnected";
  
  // MODIFIED BASE CLASSES:
  // - right-0: Aligns to the right edge.
  // - top-1/2 transform -translate-y-1/2: Centers the component vertically.
  const baseClasses = "fixed right-0 bottom-1/20 transform translate-y-1/2 z-[9999] flex items-center shadow-2xl border text-sm transition-all duration-300 cursor-pointer";

  // Dynamic classes for position and shape based on state
  const dynamicClasses = isMinimized
    // Minimized: Full circle, negative margin (-mr-5) hides the right half, creating the semi-circle illusion.
    ? `h-10 w-10 justify-center rounded-full -mr-5 ${statusColor} text-white hover:mr-0 bg-opacity-100`
    // Maximized: Uses rounded-l-xl for a curved left edge and bg-opacity-80 for transparency.
    : `bg-gray-800 bg-opacity-80 text-white px-3 py-2 rounded-l-xl border-gray-700`;

  return (
    <div 
      className={`${baseClasses} ${dynamicClasses}`}
      onClick={toggleMinimize} 
      title={isMinimized ? `Status: ${statusText} (Click to Expand)` : 'Click to Minimize'}
    >
        
      {isMinimized ? (
        // --- MINIMIZED VIEW (Semi-Circle) ---
        // Shifts content slightly left to center it in the visible area.
        <div className="text-lg absolute left-1/2 transform -translate-x-1/2">
            <FaPlug className="w-full" />
        </div>
      ) : (
        // --- MAXIMIZED VIEW (Full Bar, transparent) ---
        <>
          <span
            className={`h-3 w-3 rounded-full ${statusColor} ${statusPulse} mr-2`}
          ></span>
          <span className="font-medium">
            {statusText}
          </span>
        </>
      )}
    </div>
  );
}