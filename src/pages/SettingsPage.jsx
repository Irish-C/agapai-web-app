// src/pages/Settings.jsx
import React, { useState } from 'react';
import { FaUserCog, FaCogs, FaBell, FaUsers, FaDharmachakra, FaConnectdevelop} from 'react-icons/fa'; 

import AccountSettingsForm from '../components/AccountSettingsForm.jsx';
import CameraNotificationSettings from '../components/CameraNotificationSettings.jsx';
import UserManager from '../components/UserManager.jsx'; 
import ManagementDashboard from "../components/ManagementDashboard.jsx";

export default function Settings({ user }) {
    const isAdmin = user && user.role === 'Admin'; 
    
    const [activeSection, setActiveSection] = useState('my_account'); 
    const [locations, setLocations] = useState([]);

    const handleLocationsUpdate = (newLocations) => {
        setLocations(newLocations);
    };

    // 2. Define the navigation structure with roles
    const fullNavItems = [
        { id: 'my_account', name: 'My Account', icon: FaUserCog, role: 'all' },
        { id: 'management', name: 'Device and Location', icon: FaConnectdevelop, role: 'Admin' }, 
        { id: 'notification', name: 'Notifications', icon: FaBell, role: 'all' },
        { id: 'user_management', name: 'User Management', icon: FaUsers, role: 'Admin' }, 
    ];
    
    // 3. Filter the navigation items based on the user's role
    const navItems = fullNavItems.filter(item => {
        return item.role === 'all' || (item.role === 'Admin' && isAdmin);
    });

    const renderActiveComponent = () => {
        switch (activeSection) {
            case 'my_account':
                return <AccountSettingsForm user={user} />;
            
            case 'management':
                return isAdmin ? (
                    <ManagementDashboard 
                        locations={locations} 
                        onLocationsUpdated={handleLocationsUpdate}
                    />
                ) : (
                    <p className="text-red-500">Access Denied: You must be an Administrator to manage devices and locations.</p>
                );

            case 'notification':
                return <CameraNotificationSettings />;
            case 'user_management': 
                return isAdmin ? <UserManager user={user} /> : <p className="text-red-500">Access Denied: You must be an Administrator to manage users.</p>; 
            default:
                return <div>Please select a setting category.</div>;
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
                <h1 className="text-3xl font-extrabold text-gray-900 flex items-center mb-2">
                    <FaCogs className="mr-3 text-teal-600" />
                    System Settings
                </h1>

                <div className="flex flex-col lg:flex-row gap-6 bg-white p-4 lg:p-5 rounded-xl shadow-lg border border-gray-200">
                    
                    {/* LEFT: Side Navigation Panel */}
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

                    {/* Active Content Area */}
                    <div className="w-full lg:w-3/4">
                        <h2 className="text-2xl font-bold text-gray-900 mb-3"> 
                            {navItems.find(item => item.id === activeSection)?.name || 'Settings'}
                        </h2>
                        {renderActiveComponent()}
                    </div>
                </div>
            </main>
        </div>
    );
}