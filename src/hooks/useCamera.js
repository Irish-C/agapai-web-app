// src/hooks/useCamera.js
import { useState, useEffect, useCallback } from 'react';
import io from 'socket.io-client';

/**
 * WebSocket hook to handle connecting to the Flask-SocketIO server 
 * and managing camera and incident data streams.
 */
export const useCameraSocket = () => {
    // We remove cameraList from here. The component will fetch it.
    const [cameraData, setCameraData] = useState({});
    const [incidents, setIncidents] = useState([]);
    const [isConnected, setIsConnected] = useState(false);

    // This useEffect now only handles the socket connection.
    useEffect(() => {
        // --- FIX FOR LOCAL DEV ENVIRONMENT ---
        // We will connect *directly* to the Flask server on port 5000.
        const socket = io('http://localhost:5000', { 
            path: '/socket.io', 
            transports: ['websocket', 'polling'] 
        });
        // --- END FIX ---

        socket.on('connect', () => {
            console.log('SocketIO: Connected to Flask server');
            setIsConnected(true);
        });

        socket.on('disconnect', () => {
            console.log('SocketIO: Disconnected from Flask server');
            setIsConnected(false);
        });

        // 1. Video Frame Stream
        socket.on('camera_frame', (data) => {
            setCameraData(prev => ({
                ...prev,
                [data.cam_id]: data.frame
            }));
        });

        // 2. Incident Alert Stream
        socket.on('incident_alert', (alert) => {
            console.warn('INCIDENT ALERT RECEIVED:', alert);
            setIncidents(prev => [alert, ...prev].slice(0, 10)); // Prepend and cap list
        });

        socket.on('connect_error', (err) => {
            console.error('SocketIO Connection Error:', err);
        });

        return () => {
            console.log('SocketIO: Cleaning up socket connection...');
            socket.disconnect();
        };
    }, []); // Empty dependency array = runs once on mount

    // Return only the live data
    return { cameraData, incidents, isConnected };
};