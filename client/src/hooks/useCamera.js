import { useState, useEffect, useRef } from 'react';
import { socket } from '../services/socket.js';

export const useCameraSocket = () => {
  const [cameraData, setCameraData] = useState({});
  const [incidents, setIncidents] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [isConnected, setIsConnected] = useState(socket.connected);

  // camId -> latest frame only (overwrite old immediately)
  const latestFramesRef = useRef(new Map());

  useEffect(() => {
    const handleConnect = () => setIsConnected(true);
    const handleDisconnect = () => setIsConnected(false);

    const handleFrame = (data) => {
      const camId = data?.cam_id ?? data?.camera_id ?? data?.cameraId;
      const frame = data?.frame ?? data?.frameData ?? data?.image;
      if (camId == null || !frame) return;
      latestFramesRef.current.set(camId, frame);
    };

    const handleIncident = (alert) => {
      setIncidents((prev) => [alert, ...prev]);
    };

    const handleFall = (alert) => {
      const typeLabel = alert.event_class || alert.event_type || 'fall';
      setAlerts((prev) => [{ ...alert, ts: Date.now(), type: typeLabel }, ...prev]);
    };

    const handleInactivity = (alert) => {
      setAlerts((prev) => [{ ...alert, ts: Date.now(), type: 'inactivity' }, ...prev]);
    };

    socket.on('connect', handleConnect);
    socket.on('disconnect', handleDisconnect);
    socket.on('camera_frame', handleFrame);
    socket.on('incident_alert', handleIncident);
    socket.on('fall_detected', handleFall);
    socket.on('inactivity_detected', handleInactivity);

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
      socket.off('incident_alert', handleIncident);
      socket.off('fall_detected', handleFall);
      socket.off('inactivity_detected', handleInactivity);
    };
  }, []);

  return { cameraData, incidents, alerts, isConnected };
};
