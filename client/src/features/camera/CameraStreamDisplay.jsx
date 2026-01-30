// src/components/CameraStreamDisplay.jsx
import React from 'react';

/**
 * Component to display the live M-JPEG stream from the Pi Camera.
 * It points the <img> source to the backend proxy route.
 */
function CameraStreamDisplay({ cameraId }) {
    // The URL points to the route you added in app.py (port 5173)
    // We use a relative path, assuming your frontend (5173) is proxying 
    // API calls to the backend (5173), or the full path if necessary: 
    // const streamUrl = 'http://localhost:5173/api/live_stream/' + cameraId;
    const streamUrl = `/api/live_stream/${cameraId}`;
    
    // Fallback message for when the stream is not yet loading
    const [streamError, setStreamError] = React.useState(false);

    return (
        <div className="camera-display-container p-4 bg-gray-900 rounded-lg shadow-lg">
            <h4 className="text-white text-lg mb-3">Live Feed (Camera ID: {cameraId})</h4>
            
            {streamError && (
                <div className="w-full h-auto bg-red-800 text-white text-center p-4">
                    Connection Error: Pi Camera Stream Unavailable.
                </div>
            )}

            {/* The essential integration: the <img> tag for M-JPEG stream */}
            <img 
                src={streamUrl} 
                alt={`Live stream for Camera ${cameraId}`} 
                onError={() => {
                    // Set an error state if the image fails to load (e.g., server down)
                    setStreamError(true);
                    console.error(`Failed to load stream from ${streamUrl}`);
                }}
                onLoad={() => setStreamError(false)}
                // Apply styling and fix dimensions (matching picam.py output)
                className="w-full max-w-lg mx-auto" // Adjust sizing as needed for your layout
                style={{ aspectRatio: '640 / 480', display: streamError ? 'none' : 'block' }}
            />
        </div>
    );
}

export default CameraStreamDisplay;