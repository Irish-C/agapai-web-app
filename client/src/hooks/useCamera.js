import { useState, useEffect, useRef } from 'react';
import { socket } from '../services/socket.js';

export const useCameraSocket = () => {
  const [cameraData, setCameraData] = useState({});
  const [alerts, setAlerts] = useState([]);
  const [isConnected, setIsConnected] = useState(socket.connected);

  // camId -> latest frame only (overwrite old immediately)
  const latestFramesRef = useRef(new Map());

  useEffect(() => {
    const handleConnect = () => setIsConnected(true);
    const handleDisconnect = () => setIsConnected(false);

    const handleFrame = (data) => {
      // Standardized frame payload always has cam_id
      const camId = data?.cam_id;
      const frame = data?.frame;
      if (camId == null || !frame) return;
      latestFramesRef.current.set(camId, frame);
    };

    const handleNewAlert = (alert) => {
      // Unified incident structure: {id, type, location, timestamp, snapshot_url, status}
      // Add ts for frontend sorting convenience
      const incidentWithTs = { ...alert, ts: Date.now() };
      setAlerts((prev) => [incidentWithTs, ...prev]);
    };

    socket.on('connect', handleConnect);
    socket.on('disconnect', handleDisconnect);
    socket.on('camera_frame', handleFrame);
    socket.on('new_alert', handleNewAlert);

    setIsConnected(socket.connected);

    // flush at ~30fps, always newest frame only
    const flush = setInterval(() => {
      if (latestFramesRef.current.size === 0) return;

      setCameraData((prev) => {
        const next = { ...prev };
        for (const [camId, frame] of latestFramesRef.current.entries()) {
          next[camId] = frame;
        }
        latestFramesRef.current.clear();
        return next;
      });
    }, 33);

    return () => {
      clearInterval(flush);
      socket.off('connect', handleConnect);
      socket.off('disconnect', handleDisconnect);
      socket.off('camera_frame', handleFrame);
      socket.off('new_alert', handleNewAlert);
    };
  }, []);

  return { cameraData, alerts, isConnected };
};
