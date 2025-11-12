// src/components/ConnectionStatus.jsx
import React, { useEffect, useState } from "react";
import { socket } from "../socket";

// Accept the onLogout prop
export default function ConnectionStatus({ onLogout }) {
  const [connected, setConnected] = useState(socket.connected);

  useEffect(() => {
    const handleConnect = () => setConnected(true);
    
    // Call the provided logout function on disconnect
    const handleDisconnect = () => {
      setConnected(false);
      
      // ⬅️ CRITICAL: Call the logout function passed from App.jsx
      if (onLogout) {
          console.log("WebSocket disconnected. Initiating forced logout.");
          onLogout(); 
      }
    };

    socket.on("connect", handleConnect);
    socket.on("disconnect", handleDisconnect);

    // Clean up listeners when component unmounts
    return () => {
      socket.off("connect", handleConnect);
      socket.off("disconnect", handleDisconnect);
    };
  }, [onLogout]); // Include onLogout in dependency array

  return (
    <div className="fixed top-3 right-3 flex items-center gap-2 bg-gray-800 text-white px-3 py-2 rounded-xl shadow-md text-sm">
      <span
        className={`h-3 w-3 rounded-full ${
          connected ? "bg-green-400" : "bg-red-500"
        }`}
      ></span>
      <span>{connected ? "Connected" : "Disconnected"}</span>
    </div>
  );
}