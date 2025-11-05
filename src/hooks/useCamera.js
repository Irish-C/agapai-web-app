//useCamera.js
import { useState, useEffect, useCallback } from 'react';
import io from 'socket.io-client';

/**
 * WebSocket hook to handle connecting to the Flask-SocketIO server 
 * and managing camera and incident data streams.
 */
export const useCameraSocket = () => {
    const [cameraData, setCameraData] = useState({});
    const [incidents, setIncidents] = useState([]);
    const [isConnected, setIsConnected] = useState(false);

    // Memoize the socket initialization function
    const initializeSocket = useCallback(() => {
        // The URL is relative because Vite is configured to proxy '/socket.io' requests to the Flask backend.
        const socket = io({ 
            path: '/socket.io', 
            transports: ['websocket', 'polling'] 
        });

        socket.on('connect', () => {
            console.log('SocketIO: Connected to Flask server');
            setIsConnected(true);
        });

        socket.on('disconnect', () => {
            console.log('SocketIO: Disconnected from Flask server');
            setIsConnected(false);
        });

        // 1. Video Frame Stream (M-JPEG replacement)
        socket.on('camera_frame', (data) => {
            // data format: { cam_id: 'cam1', frame: 'base64_jpeg_string' }
            setCameraData(prev => ({
                ...prev,
                [data.cam_id]: data.frame
            }));
        });

        // 2. Incident Alert Stream (Fuzzy Logic alerts)
        socket.on('incident_alert', (alert) => {
            // alert format: { type: 'Fall Detected', location: 'Living Room', timestamp: unix_timestamp }
            console.warn('INCIDENT ALERT RECEIVED:', alert);
            setIncidents(prev => {
                // Prepend new alert to the list
                return [alert, ...prev];
            });
            
            // Cap the size of the incidents array for memory management
            setIncidents(prev => prev.slice(0, 10)); // Keep only the 10 most recent alerts
        });

        socket.on('connect_error', (err) => {
            console.error('SocketIO Connection Error:', err);
        });

        return () => {
            console.log('SocketIO: Cleaning up socket connection...');
            socket.disconnect();
        };
    }, []);

    useEffect(() => {
        const cleanup = initializeSocket();
        return cleanup;
    }, [initializeSocket]);

    return { cameraData, incidents, isConnected };
};
