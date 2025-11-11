// src/components/CameraGrid.jsx
import React, { useState, useEffect } from 'react';
import VideoFeed from './VideoFeed.jsx';
import TodayReport from './TodayReport.jsx';
import { useCameraSocket } from '../hooks/useCamera.js'; 
// We fetch locally, so no need to import fetchCameraList from apiService
import { FaCameraRetro, FaPlug, FaSpinner, FaArrowLeft, FaArrowRight } from 'react-icons/fa';

export default function CameraGrid() {
    // Data from our simplified hook
    const { cameraData, incidents, isConnected } = useCameraSocket();
    
    // State for the camera list itself
    const [cameraList, setCameraList] = useState([]);
    
    // State for pagination
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(0);
    const [totalCameras, setTotalCameras] = useState(0);

    // State for loading and errors
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    
    // This state will track which camera is "focused". null = grid view.
    const [focusedCameraId, setFocusedCameraId] = useState(null);

    // We fetch cameras inside useEffect. This now re-runs when 'currentPage' changes.
    useEffect(() => {
        const getCameras = async () => {
            setIsLoading(true);
            setError(null);
            try {
                // We fetch 4 per page for our 2x2 grid
                const response = await fetch(`/api/cameras?page=${currentPage}&per_page=4`);
                
                if (!response.ok) {
                    throw new Error(`Server error: ${response.status}`);
                }
                
                const data = await response.json();

                if (data.status === 'success') {
                    setCameraList(data.cameras);
                    setTotalPages(data.total_pages);
                    setTotalCameras(data.total_cameras);
                    
                    // Handle case where we delete the last item on a page
                    if (data.cameras.length === 0 && currentPage > 1) {
                        setCurrentPage(prevPage => prevPage - 1);
                    }
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
    }, [currentPage]); // Dependency array: re-fetch when currentPage changes!

    // Find the camera object if one is focused
    const focusedCamera = cameraList.find(c => c.id === focusedCameraId);

    // --- Pagination Handlers ---
    const goToNextPage = () => {
        setCurrentPage(page => Math.min(page + 1, totalPages));
    };

    const goToPrevPage = () => {
        setCurrentPage(page => Math.max(page - 1, 1));
    };

    const header = (
        <div className="flex items-center text-2xl font-extrabold text-gray-900 mb-4 border-b pb-2">
            <FaCameraRetro className="mr-3 text-gray-900" />
            Live View
            <span className={`ml-4 px-3 py-1 text-sm rounded-full font-semibold ${isConnected ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                <FaPlug className='inline-block mr-1' /> {isConnected ? 'WebSocket Live' : 'WebSocket Disconnected'}
            </span>
        </div>
    );

    // --- Pagination Controls Component ---
    const paginationControls = (
        <div className="flex justify-between items-center my-4">
            <button
                onClick={goToPrevPage}
                disabled={currentPage === 1 || totalPages === 0}
                className="px-4 py-2 bg-gray-300 text-gray-800 rounded disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
            >
                <FaArrowLeft className="mr-2" /> Previous
            </button>
            
            {totalPages > 0 && (
                <span className="text-gray-700">
                    Page <strong>{currentPage}</strong> of <strong>{totalPages}</strong> ({totalCameras} cameras)
                </span>
            )}

            <button
                onClick={goToNextPage}
                disabled={currentPage === totalPages || totalPages === 0}
                className="px-4 py-2 bg-gray-300 text-gray-800 rounded disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
            >
                Next <FaArrowRight className="ml-2" />
            </button>
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
                        
                        {/* Pagination Controls moved to here */}
                        {paginationControls}

                        {/* Show loading spinner only when fetching new pages */}
                        {isLoading && (
                            <div className='flex items-center justify-center p-12 text-xl text-gray-700'>
                                <FaSpinner className='animate-spin mr-2' /> Loading cameras...
                            </div>
                        )}

                        {/* Show grid only when not loading */}
                        {!isLoading && cameraList.length > 0 && (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {cameraList.map(camera => (
                                    <VideoFeed
                                        key={camera.id}
                                        camId={camera.id}
                                        location={camera.location || camera.location_name} // Handle both formats
                                        frameData={cameraData[camera.id]}
                                        isConnected={isConnected}
                                        isFocused={false}
                                        onFocusChange={setFocusedCameraId} // Pass the setter
                                    />
                                ))}
                            </div>
                        )}

                        {/* Show message if no cameras are found at all */}
                        {!isLoading && totalCameras === 0 && (
                            <div className="text-center p-12 text-gray-500">
                                <p>No cameras have been added yet.</p>
                                <p>Please go to the Settings page to add a camera.</p>
                            </div>
                        )}
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