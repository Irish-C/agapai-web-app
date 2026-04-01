// src/components/CameraGrid.jsx
import React, { useState, useEffect } from 'react';
import VideoFeed from './VideoFeed.jsx';
import TodayReport from '../dashboard/TodayReport.jsx';
import { useCameraSocket } from '../../hooks/useCamera.js';
import { FaPlug, FaSpinner, FaVideo } from 'react-icons/fa';
import { fetchCameraList } from '../../services/apiService.js';

export default function CameraGrid() {
    const { cameraData, incidents, isConnected } = useCameraSocket();
    const [cameraList, setCameraList] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [focusedCameraId, setFocusedCameraId] = useState(null);

    useEffect(() => {
        const getCameras = async () => {
            setIsLoading(true);
            setError(null);
            try {
                const data = await fetchCameraList();
                if (data?.status === 'success' && Array.isArray(data.cameras)) {
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
    }, []);

    const focusedCamera = cameraList.find(c => c.id === focusedCameraId);

    // Updated helper function to generate HLS stream URLs from MediaMTX
    const getStreamUrl = (camId) => {
        const serverUrl = "http://127.0.0.1:8888"; // Replace with your MediaMTX server's IP or domain
        return `${serverUrl}/${camId}/index.m3u8`; // HLS stream URL
    };

    const header = (
        <div className="flex items-center text-2xl font-extrabold text-gray-900 mb-4 border-b pb-2">
            <FaVideo className="mr-3 text-gray-900" />
            Live View
            <span className={`ml-4 px-3 py-1 text-sm rounded-full font-semibold ${isConnected ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                <FaPlug className='inline-block mr-1' /> {isConnected ? 'WebSocket Live' : 'WebSocket Disconnected'}
            </span>
        </div>
    );

    if (isLoading && cameraList.length === 0) {
        return (
            <div className="p-6">
                {header}
                <div className='flex items-center justify-center p-12 text-xl text-gray-700'>
                    <FaSpinner className='animate-spin mr-2' /> Loading streams ...
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
            {focusedCameraId && focusedCamera ? (
                <div className="flex-grow w-full">
                    {header}
                    <VideoFeed
                        key={focusedCamera.id}
                        camId={focusedCamera.id}
                        location={focusedCamera.location_name || focusedCamera.location || focusedCamera.loc_name}
                        streamUrl={getStreamUrl(focusedCamera.id)} // Use HLS stream URL
                        frameData={cameraData[focusedCamera.id]}
                        isConnected={isConnected}
                        isFocused={true}
                        onFocusChange={setFocusedCameraId}
                    />
                </div>
            ) : (
                <>
                    <div className="flex-grow lg:w-3/4">
                        {header}
                        {!isLoading && cameraList.length > 0 && (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {cameraList.map(camera => (
                                    <div 
                                        key={camera.id} 
                                        className={cameraList.length === 1 ? 'md:col-span-2' : ''}
                                    >
                                        <VideoFeed
                                            camId={camera.id}
                                            location={camera.location_name || camera.location || camera.loc_name}
                                            streamUrl={getStreamUrl(camera.id)} // Use HLS stream URL
                                            frameData={cameraData[camera.id]}
                                            isConnected={isConnected}
                                            isFocused={false}
                                            onFocusChange={setFocusedCameraId}
                                        />
                                    </div>
                                ))}
                            </div>
                        )}
                        {!isLoading && cameraList.length === 0 && ( 
                            <div className="text-center p-12 text-gray-500">
                                <p>No cameras have been added yet.</p>
                                <p>Please go to the Settings page to add a camera.</p>
                            </div>
                        )}
                    </div>
                    <div className="lg:w-1/4 lg:flex-shrink-0">
                        <TodayReport incidents={incidents} />
                    </div>
                </>
            )}
        </div>
    );
}