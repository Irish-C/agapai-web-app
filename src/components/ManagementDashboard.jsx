// src/components/ManagementDashboard.jsx
import React from 'react';
import CameraManager from './CameraManager.jsx'; 
import LocationManager from './LocationManager.jsx'; 

/**
 * Container component to display CameraManager on the left and LocationManager on the right.
 */
export default function ManagementDashboard({ locations, onLocationsUpdated }) {
    
    return (
        <div className="p-0"> 

            {/* Uses a grid layout to display both managers, stacked on small screens */}
            {/* The gap-4 provides horizontal spacing between the two columns */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4"> 
                
                {/* 1. Camera Manager (LEFT) */}
                <div className="pl-4">
                    <CameraManager 
                        locations={locations} 
                        onCameraUpdated={() => { /* Handle camera update */ }}
                    />
                </div>

                {/* 2. Location Manager (RIGHT) */}
                <div className="pr-4">
                    <LocationManager onLocationsUpdated={onLocationsUpdated} />
                </div>
            </div>
        </div>
    );
}