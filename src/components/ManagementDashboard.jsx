// src/components/ManagementDashboard.jsx
import React from 'react';
import CameraManager from './CameraManager.jsx'; 
import LocationManager from './LocationManager.jsx'; 

/**
 * Container component to display CameraManager on the left and LocationManager on the right.
 */
export default function ManagementDashboard({ locations, onLocationsUpdated }) {
    
    return (
        <div className="space-y-2"> 

            {/* Uses a grid layout to display both managers, stacked on small screens */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-0"> 
                
                {/* 1. Camera Manager (LEFT) */}
                <div className="bg-gray-50 px-6 pb-6 rounded-xl shadow-inner border border-gray-200">
                    <CameraManager 
                        locations={locations} 
                        onCameraUpdated={() => { /* Handle camera update */ }}
                    />
                </div>

                {/* 2. Location Manager (RIGHT) */}
                <div className="bg-gray-50 px-6 pb-6 rounded-xl shadow-inner border border-gray-200">
                    <LocationManager onLocationsUpdated={onLocationsUpdated} />
                </div>
            </div>
        </div>
    );
}