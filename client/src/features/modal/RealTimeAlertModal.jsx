// src/components/RealTimeAlertModal.jsx
import React from 'react';

/**
 * A full-screen, persistent modal to display an urgent fall alert.
 */
export default function RealTimeAlertModal({ incident, onDismiss }) {
    if (!incident) return null;

    const formattedTime = new Date(incident.timestamp * 1000).toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit'
    });
    
    // Handle dismiss button click
    const handleDismissClick = () => {
        onDismiss();
    };

    return (
        // Black translucent overlay backdrop
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{backgroundColor: 'rgba(0, 0, 0, 0.7)'}}>
            {/* White modal foreground with red soft edge */}
            <div className="bg-white rounded-lg shadow-2xl w-full max-w-2xl max-h-screen overflow-y-auto p-6 transform transition-all border-2 border-red-600" style={{boxShadow: '0 0 30px rgba(220, 38, 38, 0.4), 0 0 60px rgba(220, 38, 38, 0.2)'}}>
                <div className="flex items-center gap-3">
                    <svg className="h-12 w-12 text-red-600 animate-bounce flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                    <h3 className="text-3xl font-bold text-red-600">
                        Alert: Response Needed!
                    </h3>
                </div>

                {/* Snapshot Preview - responsive height */}
                {incident.snapshot_url && (
                    <div className="mt-6 rounded-lg overflow-hidden bg-gray-200 border-2 border-gray-300">
                        <img 
                            src={incident.snapshot_url} 
                            alt="Alert snapshot" 
                            className="w-full max-h-64 sm:max-h-80 object-cover"
                            onError={(e) => {
                                e.target.style.display = 'none';
                            }}
                        />
                    </div>
                )}

                {/* Details - consecutive lines */}
                <div className="mt-6 space-y-1 bg-gray-50 p-4 rounded-lg border border-gray-200">
                    <p className="text-base text-gray-800">
                        <span className="font-bold text-gray-900">Alert:</span> {incident.type}
                    </p>
                    <p className="text-base text-gray-800">
                        <span className="font-bold text-gray-900">Location:</span> {incident.location}
                    </p>
                    <p className="text-base text-gray-800">
                        <span className="font-bold text-gray-900">Time:</span> {formattedTime}
                    </p>
                </div>
                
                <div className="mt-6 flex gap-2">
                    <button
                        onClick={handleDismissClick}
                        className="flex-1 inline-flex justify-center rounded-lg border-none shadow-md px-6 py-3 bg-red-600 text-base font-bold text-white hover:bg-red-700 active:bg-red-800 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                    >
                        Dismiss
                    </button>
                </div>
            </div>
        </div>
    );
}