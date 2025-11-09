//CameraGrid.jsx
import React, { useState, useEffect, useMemo } from 'react';
import VideoFeed from './VideoFeed.jsx';
import TodayReport from './TodayReport.jsx';
import { useCameraSocket } from '../hooks/useCamera.js'; 
import { fetchCameraList } from '../services/apiService.js'; 
import { FaCameraRetro, FaPlug, FaSpinner } from 'react-icons/fa';


export default function CameraGrid() {
    const { cameraData, incidents, isConnected } = useCameraSocket();
    const [cameraList, setCameraList] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    
    // This state will track which camera is "focused". null = grid view.
    const [focusedCameraId, setFocusedCameraId] = useState(null);

    const defaultCameras = useMemo(() => [
        { id: 'cam1', location: 'Initializing...' },
        { id: 'cam2', location: 'Initializing...' },
        { id: 'cam3', location: 'Initializing...' },
        { id: 'cam4', location: 'Initializing...' },
    ], []);

    useEffect(() => {
        const getCameras = async () => {
            setIsLoading(true);
            try {
                const response = await fetchCameraList();
                if (response.cameras) {
                    setCameraList(response.cameras);
                } else {
                    setError('API did not return a valid camera list.');
                }
            } catch (err) {
                console.error("Failed to fetch camera list:", err);
                setError('Failed to load camera list from the server.');
                setCameraList(defaultCameras); 
            } finally {
                setIsLoading(false);
            }
        };

        getCameras();
    }, [defaultCameras]);

    const camerasToRender = cameraList.length > 0 ? cameraList : defaultCameras;

    // Find the camera object if one is focused
    const focusedCamera = useMemo(() => 
        camerasToRender.find(c => c.id === focusedCameraId),
        [focusedCameraId, camerasToRender]
    );

    const header = (
        <div className="flex items-center text-2xl font-extrabold text-gray-900 mb-4 border-b pb-2">
            <FaCameraRetro className="mr-3 text-gray-900" />
            Live View
            <span className={`ml-4 px-3 py-1 text-sm rounded-full font-semibold ${isConnected ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                <FaPlug className='inline-block mr-1' /> {isConnected ? 'WebSocket Live' : 'WebSocket Disconnected'}
            </span>
        </div>
    );

    if (isLoading) {
        return (
            <div className="p-6">
                {header}
                <div className='flex items-center justify-center p-12 text-xl text-gray-700'>
                    <FaSpinner className='animate-spin mr-2' /> Loading camera configurations...
                </div>
            </div>
        );
    }
    
    if (error) {
         return (
            <div className="p-6">
                {header}
                <div className="p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg mb-4">{error}</div>
            </div>
         );
    }

    return (
        <div className="flex flex-col lg:flex-row gap-6 p-6">
            
            {/* Conditional Layout: Focus or Grid */}
            {focusedCameraId && focusedCamera ? (
                // --- FOCUS MODE ---
                // Main content area takes full width
                <div className="flex-grow w-full">
                    {header}
                    <VideoFeed
                        key={focusedCamera.id}
                        camId={focusedCamera.id}
                        location={focusedCamera.location}
                        frameData={cameraData[focusedCamera.id]}
                        isConnected={isConnected}
                        isFocused={true}
                        onFocusChange={setFocusedCameraId} // Pass the setter
                    />
                </div>
                // Sidebar is hidden in focus mode

            ) : (
                // --- GRID MODE ---
                <>
                    {/* Main Content Area (Camera Grid) */}
                    <div className="flex-grow lg:w-3/4">
                        {header}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {camerasToRender.slice(0, 4).map(camera => (
                                <VideoFeed
                                    key={camera.id}
                                    camId={camera.id}
                                    location={camera.location}
                                    frameData={cameraData[camera.id]}
                                    isConnected={isConnected}
                                    isFocused={false}
                                    onFocusChange={setFocusedCameraId} // Pass the setter
                                />
                            ))}
                        </div>
                    </div>

                    {/* Sidebar Area (Incident Log) */}
                    <div className="lg:w-1/4 lg:flex-shrink-0">
                        <TodayReport incidents={incidents} />
                    </div>
                </>
            )}
        </div>
    );
}