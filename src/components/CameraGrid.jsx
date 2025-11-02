import React, { useState, useEffect, useMemo } from 'react';
import VideoFeed from './VideoFeed.jsx';
import TodayReport from './TodayReport.jsx';
import { useCameraSocket } from '../hooks/useCamera.js'; // Updated import path
import { fetchCameraList } from '../services/apiService.js'; // Updated import path
import { FaCameraRetro, FaPlug } from 'react-icons/fa';

export default function CameraGrid() {
    const { cameraData, incidents, isConnected } = useCameraSocket();
    const [cameraList, setCameraList] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    
    // Hardcoded initial list while fetching the real list
    const defaultCameras = useMemo(() => [
        { id: 'cam1', location: 'Initializing...' },
        { id: 'cam2', location: 'Initializing...' },
        { id: 'cam3', location: 'Initializing...' },
        { id: 'cam4', location: 'Initializing...' },
    ], []);

    // Effect to fetch the camera list from the REST API on component mount
    useEffect(() => {
        const getCameras = async () => {
            setIsLoading(true);
            try {
                // Fetches the list from the mocked API service
                const response = await fetchCameraList();
                if (response.cameras) {
                    setCameraList(response.cameras);
                } else {
                    setError('API did not return a valid camera list.');
                }
            } catch (err) {
                console.error("Failed to fetch camera list:", err);
                setError('Failed to load camera list from the server.');
                setCameraList(defaultCameras); // Fallback to default list
            } finally {
                setIsLoading(false);
            }
        };

        getCameras();
    }, [defaultCameras]);

    const camerasToRender = cameraList.length > 0 ? cameraList : defaultCameras;

    return (
        <div className="flex flex-col lg:flex-row gap-6 p-6">
            
            {/* Main Content Area (Camera Grid) */}
            <div className="flex-grow lg:w-3/4">
                <div className="flex items-center text-2xl font-bold text-gray-800 mb-4 border-b pb-2">
                    <FaCameraRetro className="mr-3 text-teal-600" />
                    Real-Time Video Feeds 
                    <span className={`ml-4 px-3 py-1 text-sm rounded-full font-semibold ${isConnected ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                        <FaPlug className='inline-block mr-1' /> {isConnected ? 'WebSocket Live' : 'WebSocket Disconnected'}
                    </span>
                </div>
                
                {isLoading && (
                     <div className='flex items-center justify-center p-12 text-xl text-gray-700'>
                        <FaSpinner className='animate-spin mr-2' /> Loading camera configurations...
                    </div>
                )}
                
                {error && <div className="p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg mb-4">{error}</div>}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Render up to 4 cameras */}
                    {camerasToRender.slice(0, 4).map(camera => (
                        <VideoFeed
                            key={camera.id}
                            camId={camera.id}
                            location={camera.location}
                            frameData={cameraData[camera.id]} // Pass base64 frame data
                            isConnected={isConnected}
                        />
                    ))}
                </div>
            </div>

            {/* Sidebar Area (Incident Log) */}
            <div className="lg:w-1/4 lg:flex-shrink-0">
                <TodayReport incidents={incidents} />
            </div>
        </div>
    );
}
