import React, { useState } from 'react';
import { FaUserCog, FaCogs, FaMapMarkerAlt, FaVideo, FaBell } from 'react-icons/fa';

// 1. Import the new components
import AccountSettingsForm from '../components/AccountSettingsForm.jsx';
import CameraManager from '../components/CameraManager.jsx';
import LocationManager from '../components/LocationManager.jsx';
import CameraNotificationSettings from '../components/AccountSettingsForm.jsx';

/**
 * Settings Page - REFACTORED to use Side Navigation
 */
export default function Settings() {
    
    // --- State for active navigation section ---
    const [activeSection, setActiveSection] = useState('account');

    // --- State to share locations between components ---
    const [locations, setLocations] = useState([]);

    const handleLocationsUpdate = (newLocations) => {
        setLocations(newLocations);
    };

    // 2. Define the navigation structure
    const navItems = [
        { id: 'account', name: 'Account', icon: FaCogs },
        { id: 'locations', name: 'Locations', icon: FaMapMarkerAlt },
        { id: 'cameras', name: 'Cameras', icon: FaVideo },
        // UPDATED NAVIGATION ITEM NAME
        { id: 'notification', name: 'Camera Activation and Notifications', icon: FaBell },
    ];
    
    // 3. Conditional rendering logic to show only the active component
    const renderActiveComponent = () => {
        switch (activeSection) {
            case 'account':
                return <AccountSettingsForm />;
            case 'locations':
                return <LocationManager onLocationsUpdated={handleLocationsUpdate} />;
            case 'cameras':
                return (
                    <CameraManager 
                        locations={locations} 
                        onCameraUpdated={() => {}} 
                    />
                );
            // NEW CASE: Render the new component
            case 'notification':
                return <CameraNotificationSettings />;
            default:
                return <MainSettingsForm />;
        }
    };

    const navLinkClass = (id) => 
        `flex items-center p-3 text-sm font-medium rounded-lg transition duration-150 cursor-pointer ${
            activeSection === id 
                ? 'bg-teal-600 text-white shadow-md' 
                : 'text-gray-700 hover:bg-gray-100'
        }`;


    return (
        <div className="flex flex-col min-h-screen bg-gray-50">
            <main className="flex-grow container mx-auto p-6">
                <h1 className="text-3xl font-extrabold text-gray-900 flex items-center mb-6">
                    <FaUserCog className="mr-3 text-teal-600" />
                    General Settings
                </h1>

                {/* Main Content Area: Responsive Side Navigation Layout */}
                <div className="flex flex-col lg:flex-row gap-6 bg-white p-4 lg:p-8 rounded-xl shadow-lg border border-gray-200">
                    
                    {/* LEFT: Side Navigation Panel (1/4 width on desktop, full width on mobile) */}
                    <nav className="w-full lg:w-1/4 space-y-2 pb-4 lg:pb-0 lg:border-r lg:pr-6">
                        <h2 className="text-lg font-semibold text-gray-800 mb-3 border-b pb-2 hidden lg:block">Navigation</h2>
                        {navItems.map((item) => {
                            const Icon = item.icon;
                            return (
                                <div
                                    key={item.id}
                                    className={navLinkClass(item.id)}
                                    onClick={() => setActiveSection(item.id)}
                                >
                                    <Icon className="mr-3 w-5 h-5" />
                                    {item.name}
                                </div>
                            );
                        })}
                    </nav>

                    {/* RIGHT: Active Content Area (3/4 width on desktop, full width on mobile) */}
                    <div className="w-full lg:w-3/4">
                        <h2 className="text-2xl font-bold text-gray-900 mb-6">
                            {/* Display the title of the active section */}
                            {navItems.find(item => item.id === activeSection)?.name || 'Settings'}
                        </h2>
                        {/* Render the currently active component */}
                        {renderActiveComponent()}
                    </div>
                </div>
            </main>
        </div>
    );
}