import React, { useState, useEffect } from 'react';
import { FaVideo, FaTimesCircle, FaLink } from 'react-icons/fa';

/**
 * Converts a Base64 string to a data URL (image).
 * @param {string} base64String - The Base64 encoded image data.
 * @returns {string} The full data URL string.
 */
const convertBase64ToDataURL = (base64String) => {
    return `data:image/jpeg;base64,${base64String}`;
};

/**
 * Renders a single video feed for a camera.
 * It receives the current frame and connection status via props.
 */
export default function VideoFeed({ camId, location, frameData, isConnected }) {
    const [imageSrc, setImageSrc] = useState(null);

    useEffect(() => {
        if (frameData) {
            // Update the image source whenever a new frame is received
            setImageSrc(convertBase64ToDataURL(frameData));
        } else {
            // Clear image if no frame is available
            setImageSrc(null);
        }
    }, [frameData]);

    const statusIcon = isConnected ? 
        <FaLink className="text-green-500" title="Connected" /> : 
        <FaTimesCircle className="text-red-500" title="Disconnected" />;

    const placeholderContent = (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-900 bg-opacity-70 text-white p-4">
            <FaVideo className="text-5xl mb-3 text-gray-400" />
            <p className="text-lg font-semibold text-gray-300">Awaiting Video Stream...</p>
            <p className="text-sm text-gray-500 mt-1">Check Flask server status.</p>
        </div>
    );

    return (
        <div className="bg-gray-800 rounded-xl shadow-lg overflow-hidden border-2 border-gray-700 hover:border-teal-500 transition duration-300">
            {/* Header */}
            <div className="flex justify-between items-center bg-gray-900 p-3 text-white border-b border-gray-700">
                <h4 className="text-md font-semibold flex items-center">
                    {statusIcon}
                    <span className="ml-2">{location} ({camId})</span>
                </h4>
                <span className="text-xs text-gray-400">Stream Status: {isConnected ? 'Live' : 'Offline'}</span>
            </div>

            {/* Video/Image Area */}
            <div className="relative w-full h-64 bg-black flex items-center justify-center">
                {imageSrc ? (
                    <img 
                        src={imageSrc} 
                        alt={`Live stream from ${location}`}
                        className="w-full h-full object-contain" // Use object-contain to prevent stretching
                    />
                ) : (
                    placeholderContent
                )}
            </div>

            {/* Footer / Controls Placeholder */}
            <div className="p-2 text-center text-xs text-gray-400 bg-gray-700">
                Last Update: {frameData ? new Date().toLocaleTimeString() : 'N/A'}
            </div>
        </div>
    );
}
