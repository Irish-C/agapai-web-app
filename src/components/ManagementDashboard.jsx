// src/components/ManagementDashboard.jsx

import React from 'react';
import { FaMapMarkerAlt, FaVideo } from 'react-icons/fa';

// Import the child components that were previously separate tabs
import CameraManager from './CameraManager.jsx'; 
import LocationManager from './LocationManager.jsx'; 

/**
 * Container component to display LocationManager and CameraManager side-by-side
 * or stacked, replacing the two separate tabs in Settings.
 */
export default function ManagementDashboard({ locations, onLocationsUpdated }) {
    
    return (
        <div className="space-y-8">
            <h2 className="text-2xl font-bold text-gray-900 flex items-center mb-6 border-b pb-2">
                Unified Device and Location Management
            </h2>

            {/* Uses a grid layout to display both managers, stacked on small screens */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                
                {/* LEFT COLUMN: Location Manager */}
                <div className="bg-gray-50 p-6 rounded-xl shadow-inner border border-gray-200">
                    <h3 className="text-xl font-semibold mb-4 flex items-center text-blue-700">
                        <FaMapMarkerAlt className="mr-2" /> Location Management
                    </h3>
                    {/* LocationManager needs to handle updates so cameras can use the new list */}
                    <LocationManager onLocationsUpdated={onLocationsUpdated} />
                </div>

                {/* RIGHT COLUMN: Camera Manager */}
                <div className="bg-gray-50 p-6 rounded-xl shadow-inner border border-gray-200">
                    <h3 className="text-xl font-semibold mb-4 flex items-center text-teal-700">
                        <FaVideo className="mr-2" /> Camera Management
                    </h3>
                    <CameraManager 
                        locations={locations} // Pass the list of locations from the state in SettingsPage
                        onCameraUpdated={() => { /* Handle camera update */ }}
                    />
                </div>
            </div>
        </div>
    );
}