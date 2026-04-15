// src/components/RealTimeAlertModal.jsx
import React from 'react';

/**
 * A full-screen, persistent modal to display an urgent fall alert.
 */
export default function RealTimeAlertModal({ incident, onDismiss }) {
    if (!incident) return null;

    const formattedTime = new Date(incident.timestamp * 1000).toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
    });
    
    // Handle dismiss button click
    const handleDismissClick = () => {
        onDismiss();
    };

    return (
        // Dark transparent overlay background - very light opacity
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-20 backdrop-blur-sm">
            {/* White modal foreground with red soft edge */}
            <div className="bg-white rounded-lg shadow-2xl w-full max-w-sm p-6 transform transition-all border-2 border-red-600" style={{boxShadow: '0 0 30px rgba(220, 38, 38, 0.4), 0 0 60px rgba(220, 38, 38, 0.2)'}}>
                <div className="text-center">
                    <svg className="mx-auto h-10 w-10 text-red-600 animate-bounce" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                    <h3 className="mt-3 text-2xl font-bold text-red-600">
                        URGENT ALERT!
                    </h3>
                </div>

                {/* Snapshot Preview - smaller */}
                {incident.snapshot_url && (
                    <div className="mt-4 rounded-lg overflow-hidden bg-gray-200 border-2 border-gray-300">
                        <img 
                            src={incident.snapshot_url} 
                            alt="Alert snapshot" 
                            className="w-full h-40 object-cover"
                            onError={(e) => {
                                e.target.style.display = 'none';
                            }}
                        />
                    </div>
                )}

                {/* Details - more compact */}
                <div className="mt-4 space-y-2 bg-gray-50 p-3 rounded-lg border border-gray-200">
                    <p className="text-sm text-gray-800">
                        <span className="font-bold text-gray-900">Alert:</span> {incident.type}
                    </p>
                    <p className="text-sm text-gray-800">
                        <span className="font-bold text-gray-900">Location:</span> {incident.location}
                    </p>
                    <p className="text-sm text-gray-800">
                        <span className="font-bold text-gray-900">Time:</span> {formattedTime}
                    </p>
                    <p className="mt-2 text-xs text-red-600 font-semibold bg-red-50 p-2 rounded border-l-4 border-red-600">
                        ⚠️ Siren and strobe are active
                    </p>
                </div>
                
                <div className="mt-5 flex gap-2">
                    <button
                        onClick={handleDismissClick}
                        className="flex-1 inline-flex justify-center rounded-lg border-none shadow-md px-4 py-2 bg-red-600 text-sm font-bold text-white hover:bg-red-700 active:bg-red-800 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                    >
                        Dismiss
                    </button>
                </div>
            </div>
        </div>
    );
}