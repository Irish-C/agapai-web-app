// src/components/CameraGrid.jsx
import React, { useState, useEffect } from 'react';
import VideoFeed from './VideoFeed.jsx';
import TodayReport from './TodayReport.jsx';
import { useCameraSocket } from '../hooks/useCamera.js';
import { FaPlug, FaSpinner, FaVideo } from 'react-icons/fa';

export default function CameraGrid() {
    // Data from our simplified hook
    const { cameraData, incidents, isConnected } = useCameraSocket();
    
    // State for the camera list itself
    const [cameraList, setCameraList] = useState([]);
    
    // State for loading and errors
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    
    // This state will track which camera is "focused". null = grid view.
    const [focusedCameraId, setFocusedCameraId] = useState(null);

    // Fetch cameras inside useEffect. Runs once on mount.
    useEffect(() => {
        const getCameras = async () => {
            setIsLoading(true);
            setError(null);
            try {
                // Fetch all cameras
                const response = await fetch(`/api/cameras`); 
                
                if (!response.ok) {
                    throw new Error(`Server error: ${response.status}`);
                }
                
                const data = await response.json();

                if (data.status === 'success') {
                    setCameraList(data.cameras);
                } else {
                    setError('API did not return a valid camera list.');
                }
            } catch (err) {
                console.error("Failed to fetch camera list:", err);
                setError(`Failed to load camera list: ${err.message}`);
            } finally {
                setIsLoading(false);
            }
        };

        getCameras();
    }, []); // <-- Dependency array emptied to run once

    // Find the camera object if one is focused
    const focusedCamera = cameraList.find(c => c.id === focusedCameraId);

    const header = (
        <div className="flex items-center text-2xl font-extrabold text-gray-900 mb-4 border-b pb-2">
            <FaVideo className="mr-3 text-gray-900" />
            Live View
            <span className={`ml-4 px-3 py-1 text-sm rounded-full font-semibold ${isConnected ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                <FaPlug className='inline-block mr-1' /> {isConnected ? 'WebSocket Live' : 'WebSocket Disconnected'}
            </span>
        </div>
    );

    if (isLoading && cameraList.length === 0) { // Only show full-page loader on initial load
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
                <div className="flex-grow w-full">
                    {header}
                    <VideoFeed
                        key={focusedCamera.id}
                        camId={focusedCamera.id}
                        location={focusedCamera.location}
                        streamUrl={focusedCamera.stream_url} 
                        frameData={cameraData[focusedCamera.id]}
                        isConnected={isConnected}
                        isFocused={true}
                        onFocusChange={setFocusedCameraId} // Pass the setter
                    />
                    <button 
                        onClick={() => setFocusedCameraId(null)}
                        className="mt-4 px-4 py-2 bg-blue-500 text-white rounded"
                    >
                        Back to Grid
                    </button>
                </div>

            ) : (
                // --- GRID MODE ---
                <>
                    {/* Main Content Area (Camera Grid) */}
                    <div className="flex-grow lg:w-3/4">
                        {header}
                        
                        {/* Pagination Controls (REMOVED) */}

                        {/* Show loading spinner only when fetching new pages */}
                        {isLoading && (
                            <div className='flex items-center justify-center p-12 text-xl text-gray-700'>
                                <FaSpinner className='animate-spin mr-2' /> Loading cameras...
                            </div>
                        )}

                        {/* Show grid only when not loading */}
                        {!isLoading && cameraList.length > 0 && (
                            // This grid container stays the same: 1 col on mobile, 2 on desktop
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {cameraList.map(camera => (
                                    // We wrap the VideoFeed in a div.
                                    // If there is only 1 camera, we tell this div to span 2 columns
                                    // on medium screens, making it fill the grid.
                                    <div 
                                        key={camera.id} 
                                        className={cameraList.length === 1 ? 'md:col-span-2' : ''}
                                    >
                                        <VideoFeed
                                            camId={camera.id}
                                            location={camera.location || camera.location_name} // Handle both formats
                                            streamUrl={camera.stream_url}
                                            frameData={cameraData[camera.id]}
                                            isConnected={isConnected}
                                            isFocused={false}
                                            onFocusChange={setFocusedCameraId} // Pass the setter
                                        />
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Show message if no cameras are found at all */}
                        {!isLoading && cameraList.length === 0 && ( 
                            <div className="text-center p-12 text-gray-500">
                                <p>No cameras have been added yet.</p>
                                <p>Please go to the Settings page to add a camera.</p>
                            </div>
                        )}
                    </div>

                    {/* Sidebar Area (Incident Log) */}
                    {/* MODIFIED: Changed lg:w-1/4 to lg:w-1/5 to reduce sidebar width */}
                    <div className="lg:w-1/5 lg:flex-shrink-0">
                        <TodayReport incidents={incidents} />
                    </div>
                </>
            )}
        </div>
    );
}