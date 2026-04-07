import { useEffect, useState } from 'react';
import { socket, addSubscribedCamera, removeSubscribedCamera } from '../services/socket.js';

export default function useDetectionSocket(cameraId) {
  const [lastEvent, setLastEvent] = useState(null);

  useEffect(() => {
    if (!cameraId) return;
    const token = localStorage.getItem('authToken');

    // Subscribe to camera room on connect
    socket.emit('subscribe_camera', { camera_id: cameraId, token });
    addSubscribedCamera(cameraId);

    const handler = (event) => {
      if (!event) return;
      setLastEvent(event);
    };

    socket.on('detection', handler);

    return () => {
      socket.off('detection', handler);
      socket.emit('unsubscribe_camera', { camera_id: cameraId, token });
      removeSubscribedCamera(cameraId);
      setLastEvent(null);
    };
  }, [cameraId]);

  return lastEvent;
}
