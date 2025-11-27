// src/components/RealTimeAlertModal.jsx
import React from 'react';

/**
 * A full-screen, persistent modal to display an urgent fall alert.
 */
export default function RealTimeAlertModal({ incident, onAcknowledge }) {
    if (!incident) return null;

    const formattedTime = new Date(incident.timestamp * 1000).toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
    });
    
    // Add a simple confirmation check before calling the acknowledge function
    const handleAcknowledgeClick = () => {
        if (window.confirm("Are you sure you want to silence the physical alarm and acknowledge this incident?")) {
            onAcknowledge();
        }
    };

    return (
        // Fixed position overlay to ensure it shows over everything
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-red-900 bg-opacity-75 backdrop-blur-sm">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-6 transform transition-all animate-pulse-red">
                <div className="text-center">
                    <svg className="mx-auto h-12 w-12 text-red-600 animate-bounce" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                    <h3 className="mt-2 text-2xl font-bold text-red-600">
                        URGENT FALL ALERT!
                    </h3>
                    <div className="mt-4 text-left">
                        <p className="text-gray-700">
                            <span className="font-semibold">Incident Type:</span> {incident.type}
                        </p>
                        <p className="text-gray-700">
                            <span className="font-semibold">Location:</span> {incident.location}
                        </p>
                        <p className="text-gray-700">
                            <span className="font-semibold">Time:</span> {formattedTime}
                        </p>
                        <p className="mt-3 text-sm text-red-500 font-medium">
                            The physical siren and strobe light are currently active.
                        </p>
                    </div>
                </div>
                <div className="mt-6">
                    <button
                        onClick={handleAcknowledgeClick}
                        className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-green-600 text-base font-medium text-white hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 sm:text-sm"
                    >
                        Acknowledge & Silence Alarm
                    </button>
                </div>
            </div>
        </div>
    );
}

// NOTE: You'll need to define a simple CSS animation for the pulse effect 
// in your main CSS file (e.g., index.css or App.css)
/*
@keyframes pulse-red {
    0%, 100% { box-shadow: 0 0 0 0 rgba(220, 38, 38, 0.7); }
    50% { box-shadow: 0 0 0 10px rgba(220, 38, 38, 0); }
}
.animate-pulse-red {
    animation: pulse-red 2s infinite;
}
*/