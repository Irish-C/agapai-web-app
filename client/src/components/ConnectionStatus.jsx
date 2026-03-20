// src/components/ConnectionStatus.jsx
import React, { useEffect, useState } from "react";
import { socket, forceReconnect } from "../services/socket";
import { FaPlug, FaSync } from "react-icons/fa"; 

export default function ConnectionStatus({ onLogout }) {
  const [status, setStatus] = useState(socket.connected ? 'connected' : 'disconnected');
  const [isMinimized, setIsMinimized] = useState(false);
  const [disconnectTime, setDisconnectTime] = useState(null);
  const [showManualReset, setShowManualReset] = useState(false);
  const logoutTimeoutRef = React.useRef(null);

  useEffect(() => {
    // Set initial status based on actual socket state
    if (socket.connected) {
      setStatus('connected');
      console.log("[ConnectionStatus] Initial state: socket already connected");
    }

    const handleConnect = () => {
      console.log("[ConnectionStatus] Connect event fired");
      setStatus('connected');
      setDisconnectTime(null);
      setShowManualReset(false);
      
      if (logoutTimeoutRef.current) {
        clearTimeout(logoutTimeoutRef.current);
        logoutTimeoutRef.current = null;
        console.log("[ConnectionStatus] Socket reconnected, logout cancelled");
      }
    };
    
    const handleDisconnect = (reason) => {
      setStatus('reconnecting');
      setDisconnectTime(Date.now());
      console.log(`[ConnectionStatus] Socket disconnected (${reason}), attempting aggressive reconnect...`);
      
      logoutTimeoutRef.current = setTimeout(() => {
        console.log("[ConnectionStatus] Still disconnected after 30s. Forcing logout.");
        setStatus('disconnected');
        if (onLogout) {
          onLogout();
        }
      }, 30000);
    };

    const handleNetworkOnline = () => {
      console.log("[ConnectionStatus] Network online detected, forcing reconnect");
      setStatus('reconnecting');
      forceReconnect();
    };

    const handleNetworkOffline = () => {
      console.log("[ConnectionStatus] Network offline detected");
      setStatus('disconnected');
    };

    socket.on("connect", handleConnect);
    socket.on("disconnect", handleDisconnect);
    window.addEventListener("online", handleNetworkOnline);
    window.addEventListener("offline", handleNetworkOffline);

    return () => {
      socket.off("connect", handleConnect);
      socket.off("disconnect", handleDisconnect);
      window.removeEventListener("online", handleNetworkOnline);
      window.removeEventListener("offline", handleNetworkOffline);
      if (logoutTimeoutRef.current) {
        clearTimeout(logoutTimeoutRef.current);
      }
    };
  }, [onLogout]); 

  const handleManualReconnect = () => {
    console.log("[ConnectionStatus] Manual reconnect triggered");
    setStatus('reconnecting');
    setShowManualReset(false);
    forceReconnect();
  };

  const toggleMinimize = () => {
    setIsMinimized(prev => !prev);
    if (!isMinimized && disconnectTime && Date.now() - disconnectTime > 15000) {
      setShowManualReset(true);
    }
  };

  const statusConfig = {
    connected: {
      color: 'bg-green-400',
      pulse: 'animate-pulse',
      text: 'Connected',
      bgClass: 'bg-gray-800 bg-opacity-80 text-white',
    },
    reconnecting: {
      color: 'bg-yellow-500',
      pulse: 'animate-pulse',
      text: 'Reconnecting...',
      bgClass: 'bg-yellow-900 bg-opacity-80 text-yellow-100',
    },
    disconnected: {
      color: 'bg-red-500',
      pulse: '',
      text: 'Disconnected',
      bgClass: 'bg-red-900 bg-opacity-80 text-red-100',
    },
  };

  const config = statusConfig[status] || statusConfig.disconnected;
  
  const baseClasses = "fixed right-0 bottom-1/20 transform translate-y-1/2 z-[9999] flex items-center shadow-2xl border text-sm transition-all duration-300 cursor-pointer";
  const dynamicClasses = isMinimized
    ? `h-10 w-10 justify-center rounded-full -mr-5 ${config.color} text-white hover:mr-0 bg-opacity-100`
    : `${config.bgClass} px-3 py-2 rounded-l-xl border-gray-700 gap-2`;

  return (
    <div>
      <div 
        className={`${baseClasses} ${dynamicClasses}`}
        onClick={toggleMinimize} 
        title={isMinimized ? `Status: ${config.text}` : 'Click to Minimize'}
      >
        {isMinimized ? (
          <div className="text-lg absolute left-1/2 transform -translate-x-1/2">
            <FaPlug className="w-full" />
          </div>
        ) : (
          <>
            <span className={`h-3 w-3 rounded-full ${config.color} ${config.pulse} flex-shrink-0`}></span>
            <span className="font-medium whitespace-nowrap flex-grow">{config.text}</span>
          </>
        )}
      </div>

      {!isMinimized && showManualReset && status !== 'connected' && (
        <div className="fixed right-0 bottom-1/20 transform translate-y-1/2 translate-x-[-340px] z-[9998]">
          <button
            onClick={handleManualReconnect}
            className="bg-purple-600 hover:bg-purple-700 text-white px-3 py-2 rounded-l-xl shadow-lg flex items-center gap-2 text-sm font-medium border border-purple-500 transition-all"
            title="Force immediate reconnection attempt"
          >
            <FaSync className="w-4 h-4" />
            Force Reconnect
          </button>
        </div>
      )}
    </div>
  );
}