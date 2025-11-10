import React, { useState, useEffect } from 'react';
import { 
    FaUserCog, 
    FaLock, 
    FaBell, 
    FaCamera, 
    FaSave, 
    FaSpinner,
    FaTrash, // <-- Added for Remove button
    FaPlus   // <-- Added for Add button
} from 'react-icons/fa';

/**
 * Settings Page with combined Camera Management.
 */
export default function Settings({ user, logout }) {
    // --- State Management ---
    const [cameras, setCameras] = useState([]);
    const [locations, setLocations] = useState([]); // <-- NEW: For the 'Add' form
    
    // State for the main settings form
    const [settings, setSettings] = useState({
        alertThreshold: 50,
        emailNotifications: true,
        cameraActive: {},
        password: '',
        confirmPassword: ''
    });
    
    // State for the "Add Camera" form
    const [newCam, setNewCam] = useState({ name: '', url: '', locId: '' });

    const [isSaving, setIsSaving] = useState(false);
    const [message, setMessage] = useState({ text: '', type: '' });
    const [camMessage, setCamMessage] = useState({ text: '', type: '' }); // Message for camera actions

    // --- Data Fetching ---
    useEffect(() => {
        fetchCameras();
        fetchLocations();
    }, []);

    const fetchCameras = () => {
        fetch('/api/cameras')
            .then(res => res.json())
            .then(data => {
                if (data.status === 'success') {
                    setCameras(data.cameras);
                    
                    // Build the initial 'cameraActive' settings
                    const initialCameraSettings = {};
                    for (const cam of data.cameras) {
                        initialCameraSettings[cam.id] = cam.status; 
                    }
                    
                    setSettings(prev => ({
                        ...prev,
                        cameraActive: initialCameraSettings
                    }));
                }
            })
            .catch(err => console.error("Error fetching cameras:", err));
    };

    const fetchLocations = () => {
        fetch('/api/locations')
            .then(res => res.json())
            .then(data => {
                if (data.status === 'success') {
                    setLocations(data.locations);
                    if (data.locations.length > 0) {
                        // Set default location for the 'Add' form
                        setNewCam(prev => ({ ...prev, locId: data.locations[0].id }));
                    }
                }
            })
            .catch(err => console.error("Error fetching locations:", err));
    };

    // --- Handlers for Main Settings ---
    const handleChange = (e) => {
        // ... (This is your existing handleChange, it's perfect)
        const { name, value, type, checked } = e.target;
        if (name.includes('.')) {
            const [parent, child] = name.split('.');
            setSettings(prev => ({ ...prev, [parent]: { ...prev[parent], [child]: type === 'checkbox' ? checked : value }}));
        } else {
            setSettings(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
        }
    };

    const handleSave = (e) => {
        e.preventDefault();
        setMessage({ text: '', type: '' });
        setIsSaving(true);
        
        // TODO: Create a backend endpoint to save these settings
        // For now, we just log it and show a mock success
        setTimeout(() => {
            setIsSaving(false);
            if (settings.password && settings.password !== settings.confirmPassword) {
                setMessage({ text: 'Error: New password and confirmation do not match.', type: 'error' });
                return;
            }
            console.log("Saving settings...", settings); 
            setMessage({ text: 'Settings saved successfully!', type: 'success' });
            setSettings(prev => ({ ...prev, password: '', confirmPassword: '' }));
        }, 1500);
    };

    // --- Handlers for Camera Management ---
    
    // Update state for the "Add Camera" form
    const handleNewCamChange = (e) => {
        const { name, value } = e.target;
        setNewCam(prev => ({ ...prev, [name]: value }));
    };

    // Handle "Add Camera" submission
    const handleAddCamera = (e) => {
        e.preventDefault();
        setCamMessage({ text: '', type: '' });

        const cameraData = {
            cam_name: newCam.name,
            stream_url: newCam.url,
            loc_id: parseInt(newCam.locId)
        };

        fetch('/api/cameras', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(cameraData)
        })
        .then(res => res.json())
        .then(data => {
            if (data.status === 'success') {
                setCamMessage({ text: 'Camera added successfully!', type: 'success' });
                setNewCam({ name: '', url: '', locId: locations[0]?.id || '' }); // Reset form
                fetchCameras(); // Refresh the entire camera list
            } else {
                setCamMessage({ text: `Error: ${data.message}`, type: 'error' });
            }
        });
    };

    // Handle "Remove" button click
    const handleDeleteCamera = (camId) => {
        if (!window.confirm('Are you sure you want to delete this camera?')) {
            return;
        }
        
        setCamMessage({ text: '', type: '' });

        fetch(`/api/cameras/${camId}`, { method: 'DELETE' })
        .then(res => res.json())
        .then(data => {
            if (data.status === 'success') {
                setCamMessage({ text: 'Camera removed successfully!', type: 'success' });
                fetchCameras(); // Refresh the entire camera list
            } else {
                setCamMessage({ text: `Error: ${data.message}`, type: 'error' });
            }
        });
    };

    // --- Render ---
    const messageClass = (msg) => msg.type === 'success'
        ? 'bg-green-100 border-green-400 text-green-700'
        : 'bg-red-100 border-red-400 text-red-700';

    return (
        <div className="flex flex-col min-h-screen bg-gray-100">
            <main className="flex-grow container mx-auto p-6">
                <h1 className="text-3xl font-extrabold text-gray-900 flex items-center mb-8 border-b pb-4">
                    <FaUserCog className="mr-3 text-teal-600" />
                    System Settings
                </h1>

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
                        {/* ... (Your password inputs here) ... */}
                    </div>

                    {/* 2. Notification Settings */}
                    <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-200">
                        <h2 className="text-2xl font-semibold text-gray-800 flex items-center mb-4 pb-2 border-b">
                            <FaBell className="mr-2 text-yellow-500" /> Notifications
                        </h2>
                        {/* ... (Your notification checkbox here) ... */}
                    </div>

                    {/* 3. Camera Activation (Moved inside the form) */}
                    <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-200">
                        <h2 className="text-2xl font-semibold text-gray-800 flex items-center mb-4 pb-2 border-b">
                            <FaCamera className="mr-2 text-gray-500" /> Camera Activation
                        </h2>
                        <div className="grid grid-cols-2 gap-4">
                            {cameras.map((cam) => (
                                <div key={cam.id} className="flex items-center p-2 border rounded-lg hover:bg-gray-50">
                                    <input
                                        id={cam.id}
                                        name={`cameraActive.${cam.id}`} 
                                        type="checkbox"
                                        checked={settings.cameraActive[cam.id] || false}
                                        onChange={handleChange}
                                        className="h-5 w-5 text-teal-600 border-gray-300 rounded focus:ring-teal-500"
                                    />
                                    <label htmlFor={cam.id} className="ml-3 text-sm font-medium text-gray-700">
                                        {cam.name} - {settings.cameraActive[cam.id] ? 'Active' : 'Inactive'}
                                    </label>
                                </div>
                            ))}
                        </div>
                    </div>
                    
                    {/* Save Button */}
                    <div className="pt-4">
                        <button type="submit" disabled={isSaving} /* ... (your className) */>
                            {/* ... (your saving/save icons) ... */}
                        </button>
                    </div>
                </form>

                {/* --- NEW: Camera Management Section --- */}
                <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-200 mt-8 max-w-4xl">
                    <h2 className="text-2xl font-semibold text-gray-800 flex items-center mb-4 pb-2 border-b">
                        <FaCamera className="mr-2 text-gray-500" /> Camera Management
                    </h2>

                    {/* Camera Action Status Message */}
                    {camMessage.text && (
                        <div className={`mb-6 p-4 border rounded-xl font-medium ${messageClass(camMessage)}`}>
                            {camMessage.text}
                        </div>
                    )}

                    {/* 1. Add Camera Form */}
                    <form onSubmit={handleAddCamera} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end mb-6">
                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="name">New Camera Name</label>
                            <input
                                type="text"
                                id="name"
                                name="name"
                                value={newCam.name}
                                onChange={handleNewCamChange}
                                className="w-full border-gray-300 rounded-lg shadow-sm focus:ring-teal-500 focus:border-teal-500"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="locId">Location</label>
                            <select
                                id="locId"
                                name="locId"
                                value={newCam.locId}
                                onChange={handleNewCamChange}
                                className="w-full border-gray-300 rounded-lg shadow-sm focus:ring-teal-500 focus:border-teal-500"
                                required
                            >
                                {locations.map(loc => (
                                    <option key={loc.id} value={loc.id}>{loc.name}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <button
                                type="submit"
                                className="w-full flex items-center justify-center bg-green-600 text-white font-bold py-2 px-4 rounded-xl hover:bg-green-700"
                            >
                                <FaPlus className="mr-2" /> Add
                            </button>
                        </div>
                        {/* Optional: Add a field for stream_url if needed */}
                    </form>
                    
                    {/* 2. Existing Camera List (for Deletion) */}
                    <h3 className="text-lg font-semibold text-gray-700 mb-2">Existing Cameras</h3>
                    <div className="space-y-2">
                        {cameras.length === 0 ? <p>No cameras added yet.</p> : null}
                        {cameras.map(cam => (
                            <div key={cam.id} className="flex justify-between items-center p-3 border rounded-lg bg-gray-50">
                                <div>
                                    <strong className="text-gray-900">{cam.name}</strong>
                                    <span className="text-gray-600 text-sm ml-2">(Location: {cam.location_name || 'N/A'})</span>
                                </div>
                                <button
                                    onClick={() => handleDeleteCamera(cam.id)}
                                    className="flex items-center bg-red-600 text-white text-sm font-bold py-1 px-3 rounded-lg hover:bg-red-700"
                                >
                                    <FaTrash className="mr-1" /> Remove
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            </main>
        </div>
    );
}