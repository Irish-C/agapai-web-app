import { useState, useEffect, useRef } from 'react';
import { socket, addEventToBuffer } from '../services/socket.js';

export const useCameraSocket = () => {
  const [cameraData, setCameraData] = useState({});
  const [alerts, setAlerts] = useState([]);
  const [isConnected, setIsConnected] = useState(socket.connected);

  // camId -> latest frame only (overwrite old immediately)
  const latestFramesRef = useRef(new Map());
  // Track last frame timestamp for each camera (to detect frozen/stale data)
  const lastFrameTimeRef = useRef(new Map());
  // Track alert IDs we've already seen to prevent duplicates after sync
  const seenAlertIdsRef = useRef(new Set());

  const STALE_FRAME_TIMEOUT = 5000; // 5 seconds - if no update, clear the frame

  useEffect(() => {
    const handleConnect = () => {
      console.log('[useCameraSocket] Socket connected');
      setIsConnected(true);
    };

    const handleDisconnect = () => {
      console.log('[useCameraSocket] Socket disconnected - buffering enabled');
      setIsConnected(false);
    };

    const handleFrame = (data) => {
      // Standardized frame payload always has cam_id
      const camId = data?.cam_id;
      const frame = data?.frame;
      if (camId == null || !frame) return;
      latestFramesRef.current.set(camId, frame);
      lastFrameTimeRef.current.set(camId, Date.now()); // Track when this frame arrived
    };

    const handleNewAlert = (alert) => {
      // Unified incident structure: {id, type, location, timestamp, snapshot_url, status}
      // Add ts for frontend sorting convenience
      const alertId = alert?.id;
      
      // Skip if we've already processed this alert (prevents duplicates after sync)
      if (alertId && seenAlertIdsRef.current.has(alertId)) {
        console.debug('[useCameraSocket] Skipping duplicate alert:', alertId);
        return;
      }
      
      if (alertId) {
        seenAlertIdsRef.current.add(alertId);
      }
      
      const incidentWithTs = { ...alert, ts: Date.now() };
      setAlerts((prev) => [incidentWithTs, ...prev]);
      
      // Buffer event if disconnected
      addEventToBuffer('new_alert', alert);
    };

    const handleAlertAccumulated = (alert) => {
      // Handle accumulated alert (multiple detections grouped together)
      // Same structure as new_alert but with occurrence_count
      const alertId = alert?.id;
      
      // Skip if we've already processed this alert
      if (alertId && seenAlertIdsRef.current.has(alertId)) {
        console.debug('[useCameraSocket] Skipping duplicate accumulated alert:', alertId);
        return;
      }
      
      if (alertId) {
        seenAlertIdsRef.current.add(alertId);
      }
      
      const incidentWithTs = { ...alert, ts: Date.now() };
      setAlerts((prev) => {
        // Update existing alert if it's from the same detection cluster
        const updated = prev.map(a => 
          String(a.id) === String(alertId) 
            ? incidentWithTs 
            : a
        );
        // If not found, add as new
        if (!updated.some(a => String(a.id) === String(alertId))) {
          updated.unshift(incidentWithTs);
        }
        return updated;
      });
      
      // Buffer event if disconnected
      addEventToBuffer('alert_accumulated', alert);
    };

    socket.on('connect', handleConnect);
    socket.on('disconnect', handleDisconnect);
    socket.on('camera_frame', handleFrame);
    socket.on('new_alert', handleNewAlert);
    socket.on('alert_accumulated', handleAlertAccumulated);

    setIsConnected(socket.connected);

    // flush at ~30fps, always newest frame only
    // also clear stale frames that haven't updated for too long
    const flush = setInterval(() => {
      const now = Date.now();
      let hasChanges = false;

      // Check for stale frames and clear them from state
      setCameraData((prev) => {
        const next = { ...prev };
        let stateChanged = false;

        // Clear frames from UI if they're older than STALE_FRAME_TIMEOUT
        for (const camId of Object.keys(next)) {
          const lastTime = lastFrameTimeRef.current.get(camId);
          if (lastTime && now - lastTime > STALE_FRAME_TIMEOUT) {
            console.warn(`[useCameraSocket] Camera ${camId} frame is stale (${now - lastTime}ms old), clearing...`);
            delete next[camId];
            stateChanged = true;
          }
        }

        // Add new frames from buffer
        for (const [camId, frame] of latestFramesRef.current.entries()) {
          next[camId] = frame;
          stateChanged = true;
        }
        latestFramesRef.current.clear();

        return stateChanged ? next : prev;
      });
    }, 33);

    return () => {
      clearInterval(flush);
      socket.off('connect', handleConnect);
      socket.off('disconnect', handleDisconnect);
      socket.off('camera_frame', handleFrame);
      socket.off('new_alert', handleNewAlert);
      socket.off('alert_accumulated', handleAlertAccumulated);
      latestFramesRef.current.clear();
      lastFrameTimeRef.current.clear();
    };
  }, []);

  return { cameraData, alerts, isConnected };
};
