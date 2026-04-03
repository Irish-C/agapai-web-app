import { useEffect, useRef } from 'react';
import { socket, addSubscribedCamera, removeSubscribedCamera } from '../../../services/socket.js';

/**
 * Manages Socket.IO subscription to camera status updates.
 * Auto-subscribes on mount, unsubscribes on unmount, and relays camera errors.
 * 
 * @param {string|number} camId - Camera ID to subscribe to
 * @param {Function} onCameraError - Callback when camera has an error status
 * @returns {void}
 */
export function useCameraSubscription(camId, onCameraError) {
  const subscriptionRef = useRef(null);

  useEffect(() => {
    // Only subscribe if not already subscribed
    if (subscriptionRef.current === camId) {
      return; // Already subscribed to this camera
    }

    subscriptionRef.current = camId;
    
    // Track subscription for auto-resubscribe on reconnect
    addSubscribedCamera(camId);
    const authToken = localStorage.getItem('authToken');

    try {
      socket.emit('subscribe_camera', { camera_id: camId, token: authToken });
    } catch (e) {
      console.warn(`[useCameraSubscription] Failed to subscribe to camera ${camId}:`, e);
      subscriptionRef.current = null;
    }

    // Listen for camera status events and relay critical errors
    const handleCameraStatus = (data) => {
      if (data.cam_id === String(camId)) {
        if (data.status === 'error') {
          onCameraError?.('error');
        }
      }
    };

    socket.on('camera_status', handleCameraStatus);

    return () => {
      // Unsubscribe when component unmounts
      try {
        socket.emit('unsubscribe_camera', { camera_id: camId, token: authToken });
      } catch (e) {}
      removeSubscribedCamera(camId);
      socket.off('camera_status', handleCameraStatus);
      subscriptionRef.current = null;
    };
  }, [camId, onCameraError]);
}
