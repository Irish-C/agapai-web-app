// src/components/ManagementDashboard.jsx
import React from 'react';
import CameraManager from './CameraManager.jsx'; 

/**
 * Container component to display CameraManager with integrated LocationManager.
 */
export default function ManagementDashboard({ locations, onLocationsUpdated }) {
    
    return (
        <div>
            {/* Camera & Locations Manager (Combined) */}
            <CameraManager 
                locations={locations} 
                onCameraUpdated={() => { /* Handle camera update */ }}
            />
        </div>
    );
}