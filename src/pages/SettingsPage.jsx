// src/pages/Settings.jsx
import React, { useState } from 'react';
// Import the icon for User Management
import { FaUserCog, FaCogs, FaMapMarkerAlt, FaVideo, FaBell, FaUsers } from 'react-icons/fa'; 

// Import the new components
import AccountSettingsForm from '../components/AccountSettingsForm.jsx';
import CameraManager from '../components/CameraManager.jsx';
import LocationManager from '../components/LocationManager.jsx';
import CameraNotificationSettings from '../components/CameraNotificationSettings.jsx';
import UserManager from '../components/UserManager.jsx'; 

// Settings component now accepts 'user' object from App.jsx via props
export default function Settings({ user }) {
    
    // Check if the current user is an admin
    const isAdmin = user && user.role === 'admin'; 
    
    // --- State for active navigation section ---
    const [activeSection, setActiveSection] = useState('my_account'); 

    // --- State to share locations between components ---
    const [locations, setLocations] = useState([]);

    const handleLocationsUpdate = (newLocations) => {
        setLocations(newLocations);
    };

    // 1. Define the full navigation structure with User Management at the end
    const fullNavItems = [
        { id: 'my_account', name: 'My Account', icon: FaUserCog, role: 'all' },
        { id: 'locations', name: 'Locations', icon: FaMapMarkerAlt, role: 'admin' },
        { id: 'cameras', name: 'Cameras', icon: FaVideo, role: 'admin' },
        { id: 'notification', name: 'Notifications', icon: FaBell, role: 'all' },
        { id: 'user_management', name: 'User Management', icon: FaUsers, role: 'admin' }, // <-- MOVED TO THE END
    ];
    
    // 2. Filter the navigation items based on the user's role
    const navItems = fullNavItems.filter(item => {
        return item.role === 'all' || (item.role === 'admin' && isAdmin);
    });

    // 3. Conditional rendering logic
    const renderActiveComponent = () => {
        switch (activeSection) {
            case 'my_account':
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
            case 'notification':
                return <CameraNotificationSettings />;
            case 'user_management': // <-- NEW CASE for User Management
                // IMPORTANT: Use the isAdmin check here as a fallback security layer
                return isAdmin ? <UserManager user={user} /> : <p className="text-red-500">Access Denied: You must be an Administrator to manage users.</p>; 
            default:
                // Ensure default case handles a potentially invalid activeSection after filtering
                const firstAvailableSection = navItems[0]?.id || 'my_account';
                return renderActiveComponent(firstAvailableSection); 
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
                    <FaCogs className="mr-3 text-teal-600" />
                    System Settings
                </h1>

                <div className="flex flex-col lg:flex-row gap-6 bg-white p-4 lg:p-8 rounded-xl shadow-lg border border-gray-200">
                    
                    {/* LEFT: Side Navigation Panel */}
                    <nav className="w-full lg:w-1/4 space-y-2 pb-4 lg:pb-0 lg:border-r lg:pr-6">
                        <h2 className="text-lg font-semibold text-gray-800 mb-3 border-b pb-2 hidden lg:block">Navigation</h2>
                        {/* Map over the filtered navItems array */}
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

                    {/* Active Content Area */}
                    <div className="w-full lg:w-3/4">
                        <h2 className="text-2xl font-bold text-gray-900 mb-6">
                            {navItems.find(item => item.id === activeSection)?.name || 'Settings'}
                        </h2>
                        {renderActiveComponent()}
                    </div>
                </div>
            </main>
        </div>
    );
}