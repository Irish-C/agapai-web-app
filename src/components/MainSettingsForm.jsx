import React, { useState, useEffect } from 'react';
import { fetchApi } from '../services/apiService'; 
import { 
    FaLock, 
    FaBell, 
    FaCamera, 
    FaSave, 
    FaSpinner 
} from 'react-icons/fa';

// This component handles the main settings form
export default function MainSettingsForm() {
    const [settings, setSettings] = useState({
        alertThreshold: 50,
        emailNotifications: true,
        cameraActive: {},
        password: '',
        confirmPassword: ''
    });
    const [cameras, setCameras] = useState([]);
    const [isSaving, setIsSaving] = useState(false);
    const [message, setMessage] = useState({ text: '', type: '' });

    // Fetch cameras on mount to populate the activation toggles
    useEffect(() => {
        fetchCameras();
    }, []);

    const fetchCameras = async () => {
        try {
            const data = await fetchApi('/cameras', 'GET');
            if (data.status === 'success') {
                setCameras(data.cameras);
                const initialCameraSettings = {};
                for (const cam of data.cameras) {
                    initialCameraSettings[cam.id] = cam.status; 
                }
                setSettings(prev => ({
                    ...prev,
                    cameraActive: initialCameraSettings
                }));
            }
        } catch (err) {
            console.error("Error fetching cameras:", err);
            setMessage({ text: `Failed to load camera toggles: ${err.message}`, type: 'error' });
        }
    };

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        if (name.includes('.')) {
            const [parent, child] = name.split('.');
            setSettings(prev => ({ ...prev, [parent]: { ...prev[parent], [child]: type === 'checkbox' ? checked : value }}));
        } else {
            setSettings(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
        }
    };

    const handleSave = async (e) => {
        e.preventDefault();
        setMessage({ text: '', type: '' });
        setIsSaving(true);
        
        if (settings.password && settings.password !== settings.confirmPassword) {
            setMessage({ text: 'Error: New password and confirmation do not match.', type: 'error' });
            setIsSaving(false);
            return;
        }

        try {
            const apiCalls = [];
            if (settings.password) {
                apiCalls.push(fetchApi('/users/change-password', 'POST', { new_password: settings.password }));
            }
            apiCalls.push(fetchApi('/settings/notifications', 'POST', {
                alert_threshold: settings.alertThreshold,
                email_notifications: settings.emailNotifications
            }));
            apiCalls.push(fetchApi('/cameras/bulk-status', 'POST', { statuses: settings.cameraActive }));

            const results = await Promise.all(apiCalls.map(p => p.catch(e => e)));
            const failed = results.filter(res => res instanceof Error || res.status !== 'success');

            if (failed.length > 0) {
                const errorMessages = failed.map(f => f.message || 'Unknown error').join(', ');
                throw new Error(`Failed to save some settings: ${errorMessages}`);
            }

            setMessage({ text: 'Settings saved successfully!', type: 'success' });
            setSettings(prev => ({ ...prev, password: '', confirmPassword: '' }));
            fetchCameras(); // Refresh camera data

        } catch (error) {
            console.error("Error saving settings:", error);
            setMessage({ text: error.message, type: 'error' });
        } finally {
            setIsSaving(false);
        }
    };

    const messageClass = (msg) => msg.type === 'success'
        ? 'bg-green-100 border-green-400 text-green-700'
        : 'bg-red-100 border-red-400 text-red-700';

    return (
        <>
            {/* Main Settings Status Message */}
            {message.text && (
                <div className={`mb-6 p-4 border rounded-xl font-medium ${messageClass(message)}`}>
                    {message.text}
                </div>
            )}

            {/* --- Main Settings Form (Security, Notifications) --- */}
            <form onSubmit={handleSave} className="space-y-8 max-w-4xl">
                
                {/* 1. Security Settings */}
                <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-200">
                    <h2 className="text-2xl font-semibold text-gray-800 flex items-center mb-4 pb-2 border-b">
                        <FaLock className="mr-2 text-blue-500" /> Security
                    </h2>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="password">
                                New Password
                            </label>
                            <input
                                type="password"
                                id="password"
                                name="password"
                                value={settings.password}
                                onChange={handleChange}
                                className="w-full border-gray-300 rounded-lg shadow-sm focus:ring-teal-500 focus:border-teal-500"
                                placeholder="Enter new password"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="confirmPassword">
                                Confirm New Password
                            </label>
                            <input
                                type="password"
                                id="confirmPassword"
                                name="confirmPassword"
                                value={settings.confirmPassword}
                                onChange={handleChange}
                                className="w-full border-gray-300 rounded-lg shadow-sm focus:ring-teal-500 focus:border-teal-500"
                                placeholder="Confirm new password"
                            />
                        </div>
                    </div>
                </div>

                {/* 2. Notification Settings */}
                <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-200">
                    <h2 className="text-2xl font-semibold text-gray-800 flex items-center mb-4 pb-2 border-b">
                        <FaBell className="mr-2 text-yellow-500" /> Notifications
                    </h2>
                    <div className="flex items-center">
                        <input
                            id="emailNotifications"
                            name="emailNotifications"
                            type="checkbox"
                            checked={settings.emailNotifications}
                            onChange={handleChange}
                            className="h-5 w-5 text-teal-600 border-gray-300 rounded focus:ring-teal-500"
                        />
                        <label htmlFor="emailNotifications" className="ml-3 text-sm font-medium text-gray-700">
                            Receive email notifications for new incidents
                        </label>
                    </div>
                </div>

                {/* 3. Camera Activation */}
                <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-200">
                    <h2 className="text-2xl font-semibold text-gray-800 flex items-center mb-4 pb-2 border-b">
                        <FaCamera className="mr-2 text-gray-500" /> Camera Activation
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {cameras.map((cam) => (
                            <div key={cam.id} className="flex items-center p-2 border rounded-lg hover:bg-gray-50">
                                <input
                                    id={`cam-active-${cam.id}`}
                                    name={`cameraActive.${cam.id}`} 
                                    type="checkbox"
                                    checked={settings.cameraActive[cam.id] || false}
                                    onChange={handleChange}
                                    className="h-5 w-5 text-teal-600 border-gray-300 rounded focus:ring-teal-500"
                                />
                                <label htmlFor={`cam-active-${cam.id}`} className="ml-3 text-sm font-medium text-gray-700">
                                    {cam.name} - {settings.cameraActive[cam.id] ? 'Active' : 'Inactive'}
                                </label>
                            </div>
                        ))}
                    </div>
                </div>
                
                {/* Save Button */}
                <div className="pt-4">
                    <button 
                        type="submit" 
                        disabled={isSaving}
                        className="flex items-center justify-center bg-teal-600 text-white font-bold py-3 px-6 rounded-xl hover:bg-teal-700 disabled:opacity-50 w-full md:w-auto"
                    >
                        {isSaving ? (
                            <FaSpinner className="animate-spin mr-2" />
                        ) : (
                            <FaSave className="mr-2" />
                        )}
                        {isSaving ? 'Saving...' : 'Save All Settings'}
                    </button>
                </div>
            </form>
        </>
    );
}