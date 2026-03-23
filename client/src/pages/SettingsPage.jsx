// src/pages/Settings.jsx
import React, { useState } from 'react';
import { FaUserCog, FaCogs, FaBell, FaUsers, FaConnectdevelop, FaLock, FaHistory} from 'react-icons/fa'; 

import { normalizeRole } from '../utils/roleUtils.js';
import { useUserFeatures } from '../hooks/useUserFeatures.js';

import AccountSettingsForm from '../features/form/AccountSettingsForm.jsx';
import CameraNotificationSettings from '../features/camera/CameraNotificationSettings.jsx';
import UserManager from '../features/manager/UserManager.jsx'; 
import ManagementDashboard from "../features/manager/ManagementDashboard.jsx";
import PermissionManager from '../components/features/PermissionManager.jsx';
import AuditLogViewer from '../components/features/AuditLogViewer.jsx';

export default function Settings({ user }) {
    const { features: userFeatures, hasFeature } = useUserFeatures();
    const isAdmin = normalizeRole(user?.role) === 'admin';
    const isSuperAdmin = normalizeRole(user?.role) === 'superadmin';
    
    // Debug logging
    console.log('[SettingsPage] Component rendered');
    console.log('[SettingsPage] User role:', user?.role);
    console.log('[SettingsPage] Features available:', userFeatures);
    console.log('[SettingsPage] Feature count:', Object.keys(userFeatures || {}).length);
    console.log('[SettingsPage] Visible features:', Object.entries(userFeatures || {}).filter(([, v]) => v === true).map(([k]) => k).join(', '));
    console.log('[SettingsPage] view_profile available:', hasFeature('view_profile'));
    console.log('[SettingsPage] view_settings available:', hasFeature('view_settings'));
    console.log('[SettingsPage] view_users available:', hasFeature('view_users'));
    console.log('[SettingsPage] view_cameras available:', hasFeature('view_cameras'));
    console.log('[SettingsPage] view_locations available:', hasFeature('view_locations'));
    console.log('[SettingsPage] configure_permissions available:', hasFeature('configure_permissions'));
    console.log('[SettingsPage] view_audit_log available:', hasFeature('view_audit_log'));
    
    const [activeSection, setActiveSection] = useState('my_account'); 
    const [locations, setLocations] = useState([]);

    const handleLocationsUpdate = (newLocations) => {
        setLocations(newLocations);
    };

    // Define the navigation structure with required features
    const fullNavItems = [
        { id: 'my_account', name: 'My Account', icon: FaUserCog, requiredFeature: 'view_profile' },
        { id: 'devloc_management', name: 'Device and Location', icon: FaConnectdevelop, requiredFeatures: ['view_cameras', 'view_locations'] }, 
        { id: 'notification', name: 'Notifications', icon: FaBell, requiredFeature: 'view_settings' },
        { id: 'user_management', name: 'User Management', icon: FaUsers, requiredFeature: 'view_users' },
        { id: 'permissions', name: 'Role Permissions', icon: FaLock, requiredFeature: 'configure_permissions' },
        { id: 'audit_log', name: 'Audit Log', icon: FaHistory, requiredFeature: 'view_audit_log' }, 
    ];
    
    // Filter the navigation items based on the user's features
    const navItems = fullNavItems.filter(item => {
        if (item.requiredFeatures) {
            // If requiredFeatures (plural), user needs ANY of those features
            return item.requiredFeatures.some(feature => hasFeature(feature));
        } else if (item.requiredFeature) {
            // If requiredFeature (singular), user needs that specific feature
            return hasFeature(item.requiredFeature);
        }
        return false;
    });

    const renderActiveComponent = () => {
        switch (activeSection) {
            case 'my_account':
                return hasFeature('view_profile') ? (
                    <AccountSettingsForm user={user} />
                ) : (
                    <p className="text-red-500">Access Denied: You don't have permission to view your account settings.</p>
                );
            
            case 'devloc_management':
                return (hasFeature('view_cameras') || hasFeature('view_locations')) ? (
                    <ManagementDashboard 
                        locations={locations} 
                        onLocationsUpdated={handleLocationsUpdate}
                    />
                ) : (
                    <p className="text-red-500">Access Denied: You don't have permission to manage devices and locations.</p>
                );

            case 'notification':
                return hasFeature('view_settings') ? (
                    <CameraNotificationSettings />
                ) : (
                    <p className="text-red-500">Access Denied: You don't have permission to view notification settings.</p>
                );
            
            case 'user_management': 
                return hasFeature('view_users') ? (
                    <UserManager user={user} />
                ) : (
                    <p className="text-red-500">Access Denied: You don't have permission to manage users.</p>
                );
            
            case 'permissions':
                return hasFeature('configure_permissions') ? (
                    <PermissionManager />
                ) : (
                    <p className="text-red-500">Access Denied: You don't have permission to configure permissions.</p>
                );
            
            case 'audit_log':
                return hasFeature('view_audit_log') ? (
                    <AuditLogViewer />
                ) : (
                    <p className="text-red-500">Access Denied: You don't have permission to view audit logs.</p>
                );
            
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
        <div className="flex flex-col min-h-screen">
            <main className="flex-grow container mx-auto p-6">
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
                        <div className="mb-3">
                            <h2 className="text-2xl font-bold text-gray-900"> 
                                {navItems.find(item => item.id === activeSection)?.name || 'Settings'}
                            </h2>
                            <div className="mb-8" />
                        </div>
                        {renderActiveComponent()}
                    </div>
                </div>
            </main>
        </div>
    );
}