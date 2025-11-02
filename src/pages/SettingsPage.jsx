import React from 'react';
import Header from '../components/common/Header.jsx';
import Footer from '../components/common/Footer.jsx';
import { FaUserCog, FaLock, FaBell, FaCamera, FaSave } from 'react-icons/fa';

/**
 * Settings Page with mock configuration options.
 */
export default function Settings({ user, logout }) {
    // Mock settings state
    const [settings, setSettings] = React.useState({
        alertThreshold: 50,
        emailNotifications: true,
        cameraActive: { cam1: true, cam2: false, cam3: true, cam4: true },
        password: '',
        confirmPassword: ''
    });
    
    const [isSaving, setIsSaving] = React.useState(false);
    const [message, setMessage] = React.useState({ text: '', type: '' });

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        
        if (name.includes('.')) {
            // Handle nested state like cameraActive.cam1
            const [parent, child] = name.split('.');
            setSettings(prev => ({
                ...prev,
                [parent]: {
                    ...prev[parent],
                    [child]: type === 'checkbox' ? checked : value
                }
            }));
        } else {
            setSettings(prev => ({
                ...prev,
                [name]: type === 'checkbox' ? checked : value
            }));
        }
    };

    const handleSave = (e) => {
        e.preventDefault();
        setMessage({ text: '', type: '' });
        setIsSaving(true);
        
        // Mock API call simulation
        setTimeout(() => {
            setIsSaving(false);
            if (settings.password && settings.password !== settings.confirmPassword) {
                setMessage({ text: 'Error: New password and confirmation do not match.', type: 'error' });
                return;
            }

            // In a real app, this would be a secure API call (e.g., PUT /api/settings)
            console.log("Saving settings...", settings); 
            setMessage({ text: 'Settings saved successfully!', type: 'success' });
            setSettings(prev => ({ ...prev, password: '', confirmPassword: '' })); // Clear passwords on success
        }, 1500);
    };
    
    const messageClass = message.type === 'success' 
        ? 'bg-green-100 border-green-400 text-green-700' 
        : message.type === 'error' 
        ? 'bg-red-100 border-red-400 text-red-700' 
        : 'hidden';
        
    return (
        <div className="flex flex-col min-h-screen bg-gray-100">
            <Header user={user} logout={logout} />
            
            <main className="flex-grow container mx-auto p-6">
                <h1 className="text-3xl font-extrabold text-gray-900 flex items-center mb-8 border-b pb-4">
                    <FaUserCog className="mr-3 text-teal-600" />
                    System Settings
                </h1>

                {/* Status Message */}
                {message.text && (
                    <div className={`mb-6 p-4 border rounded-xl font-medium ${messageClass}`}>
                        {message.text}
                    </div>
                )}

                <form onSubmit={handleSave} className="space-y-8 max-w-4xl">
                    
                    {/* 1. Security Settings */}
                    <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-200">
                        <h2 className="text-2xl font-semibold text-gray-800 flex items-center mb-4 pb-2 border-b">
                            <FaLock className="mr-2 text-blue-500" /> Security
                        </h2>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="password">New Password</label>
                                <input
                                    type="password"
                                    id="password"
                                    name="password"
                                    value={settings.password}
                                    onChange={handleChange}
                                    className="w-full border-gray-300 rounded-lg shadow-sm focus:ring-teal-500 focus:border-teal-500"
                                    placeholder="Leave blank to keep current password"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="confirmPassword">Confirm New Password</label>
                                <input
                                    type="password"
                                    id="confirmPassword"
                                    name="confirmPassword"
                                    value={settings.confirmPassword}
                                    onChange={handleChange}
                                    className="w-full border-gray-300 rounded-lg shadow-sm focus:ring-teal-500 focus:border-teal-500"
                                    placeholder="Re-enter new password"
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
                                Enable Email Notifications for Critical Alerts
                            </label>
                        </div>
                    </div>

                    {/* 3. Camera Configuration */}
                    <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-200">
                        <h2 className="text-2xl font-semibold text-gray-800 flex items-center mb-4 pb-2 border-b">
                            <FaCamera className="mr-2 text-gray-500" /> Camera Activation
                        </h2>
                        <div className="grid grid-cols-2 gap-4">
                            {Object.keys(settings.cameraActive).map((camId) => (
                                <div key={camId} className="flex items-center p-2 border rounded-lg hover:bg-gray-50">
                                    <input
                                        id={camId}
                                        name={`cameraActive.${camId}`}
                                        type="checkbox"
                                        checked={settings.cameraActive[camId]}
                                        onChange={handleChange}
                                        className="h-5 w-5 text-teal-600 border-gray-300 rounded focus:ring-teal-500"
                                    />
                                    <label htmlFor={camId} className="ml-3 text-sm font-medium text-gray-700">
                                        {camId.toUpperCase()} - {settings.cameraActive[camId] ? 'Active' : 'Inactive'}
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
                            className={`w-full flex items-center justify-center text-white font-bold py-3 px-6 rounded-xl transition duration-300 ${
                                isSaving ? 'bg-teal-400 cursor-not-allowed' : 'bg-teal-600 hover:bg-teal-700 shadow-xl'
                            }`}
                        >
                            {isSaving ? (
                                <>
                                    <FaSpinner className="animate-spin mr-3" />
                                    Saving...
                                </>
                            ) : (
                                <>
                                    <FaSave className="mr-3" />
                                    Save Changes
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </main>

            <Footer />
        </div>
    );
}