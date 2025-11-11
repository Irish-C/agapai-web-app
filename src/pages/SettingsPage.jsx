import React, { useState } from 'react'; // <-- Import useState
import { FaUserCog } from 'react-icons/fa';

// 1. Import the new components
import MainSettingsForm from '../components/MainSettingsForm.jsx';
import CameraManager from '../components/CameraManager.jsx';
import LocationManager from '../components/LocationManager.jsx';

/**
 * Settings Page - REFACTORED
 * This page is now a simple container. All the complex logic has been
 * moved into its own components.
 */
export default function Settings() {
    
    // --- State to share locations between components ---
    // We lift this state up so LocationManager can update it,
    // and CameraManager can receive it (for its dropdown).
    const [locations, setLocations] = useState([]);

    // This function will be passed to LocationManager so it can
    // notify this parent component when locations are updated.
    const handleLocationsUpdate = (newLocations) => {
        setLocations(newLocations);
    };

    return (
        <div className="flex flex-col min-h-screen">
            <main className="flex-grow container mx-auto p-6">
                <h1 className="text-3xl font-extrabold text-gray-900 flex items-center mb-8 border-b pb-4">
                    <FaUserCog className="mr-3 text-teal-600" />
                    System Settings
                </h1>

                {/* 2. Render the Main Settings Form */}
                {/* It fetches its own camera data internally */}
                <MainSettingsForm />
                
                {/* 3. Render the Location Manager */}
                {/* It fetches its own data AND notifies the parent on update */}
                <LocationManager onLocationsUpdated={handleLocationsUpdate} />

                {/* 4. Render the Camera Manager */}
                {/* We pass the locations list down to it */}
                <CameraManager 
                    locations={locations} 
                    onCameraUpdated={() => {}} // Can be used to notify MainSettingsForm
                />

            </main>
        </div>
    );
}