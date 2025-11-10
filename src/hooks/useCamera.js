import { useState, useEffect, useCallback } from 'react';
import io from 'socket.io-client';

/**
 * WebSocket hook to handle connecting to the Flask-SocketIO server 
 * and managing camera and incident data streams.
 */
export const useCameraSocket = () => {
    const [cameraList, setCameraList] = useState([]); // <-- NEW: Holds camera metadata (id, name)
    const [cameraData, setCameraData] = useState({});
    const [incidents, setIncidents] = useState([]);
    const [isConnected, setIsConnected] = useState(false);

    // NEW: Fetch the list of cameras from our REST API
    useEffect(() => {
        const fetchCameraList = async () => {
            try {
                // Use the new API endpoint we created
                // Note: The "http://localhost:5000" prefix is handled by the Vite proxy
                const response = await fetch('/api/cameras'); 
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                const data = await response.json();
                
                if (data.status === 'success') {
                    console.log('SocketIO: Fetched camera list', data.cameras);
                    setCameraList(data.cameras);
                } else {
                    console.error('Failed to fetch camera list:', data.message);
                }
            } catch (error) {
                console.error('Error fetching camera list:', error);
            }
        };

        fetchCameraList();
    }, []); // Empty dependency array = runs once on mount

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

        // 1. Video Frame Stream
        socket.on('camera_frame', (data) => {
            // data format: { cam_id: 1, frame: 'base64_jpeg_string' }
            // The 'cam_id' is now the database ID (e.g., 1, 2)
            setCameraData(prev => ({
                ...prev,
                [data.cam_id]: data.frame
            }));
        });

        // 2. Incident Alert Stream
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
    }, []); // Empty dependency array = runs once on mount

    useEffect(() => {
        const cleanup = initializeSocket();
        return cleanup;
    }, [initializeSocket]);

    // Return the new cameraList along with the other data
    return { cameraList, cameraData, incidents, isConnected };
};