// src/hooks/useCamera.js
import { useState, useEffect } from 'react';
import { socket } from '../services/socket.js';

/**
 * WebSocket hook to handle connecting to the Flask-SocketIO server 
 * and managing camera and incident data streams.
 */
export const useCameraSocket = () => {
    const [cameraData, setCameraData] = useState({});
    const [incidents, setIncidents] = useState([]);
    const [isConnected, setIsConnected] = useState(socket.connected);

    useEffect(() => {
        const handleConnect = () => {
            console.log('SocketIO: Connected to server');
            setIsConnected(true);
        };
        const handleDisconnect = () => {
            console.log('SocketIO: Disconnected from server');
            setIsConnected(false);
        };

        const handleFrame = (data) => {
            setCameraData(prev => ({
                ...prev,
                [data.cam_id]: data.frame
            }));
        };

        const handleIncident = (alert) => {
            console.warn('INCIDENT ALERT RECEIVED:', alert);
            setIncidents(prev => [alert, ...prev].slice(0, 10)); // Prepend and cap list
        };

        socket.on('connect', handleConnect);
        socket.on('disconnect', handleDisconnect);
        socket.on('camera_frame', handleFrame);
        socket.on('incident_alert', handleIncident);

        // Ensure we reflect the current connection state immediately upon mount
        setIsConnected(socket.connected);

        return () => {
            socket.off('connect', handleConnect);
            socket.off('disconnect', handleDisconnect);
            socket.off('camera_frame', handleFrame);
            socket.off('incident_alert', handleIncident);
        };
    }, []); // Empty dependency array = runs once on mount

    // Return only the live data
    return { cameraData, incidents, isConnected };
};