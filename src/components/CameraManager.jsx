import React, { useState, useEffect } from 'react';
import { fetchApi } from '../services/apiService'; 
import { FaCamera, FaTrash, FaPlus } from 'react-icons/fa';

// This component manages adding and removing cameras
export default function CameraManager() {
    const [cameras, setCameras] = useState([]);
    const [locations, setLocations] = useState([]);
    const [newCam, setNewCam] = useState({ name: '', url: '', locId: '' });
    const [camMessage, setCamMessage] = useState({ text: '', type: '' });

    // Fetch cameras and locations on mount
    useEffect(() => {
        fetchCameras();
        fetchLocations();
    }, []);

    const fetchCameras = async () => {
        try {
            const data = await fetchApi('/cameras', 'GET');
            if (data.status === 'success') {
                setCameras(data.cameras);
            }
        } catch (err) {
            console.error("Error fetching cameras:", err);
            setCamMessage({ text: `Failed to load cameras: ${err.message}`, type: 'error' });
        }
    };

    const fetchLocations = async () => {
        try {
            const data = await fetchApi('/locations', 'GET');
            if (data.status === 'success') {
                setLocations(data.locations);
                if (data.locations.length > 0) {
                    setNewCam(prev => ({ ...prev, locId: data.locations[0].id }));
                }
            }
        } catch (err) {
            console.error("Error fetching locations:", err);
            setCamMessage({ text: `Failed to load locations dropdown: ${err.message}`, type: 'error' });
        }
    };

    const handleNewCamChange = (e) => {
        const { name, value } = e.target;
        setNewCam(prev => ({ ...prev, [name]: value }));
    };

    const handleAddCamera = async (e) => {
        e.preventDefault();
        setCamMessage({ text: '', type: '' });
        const cameraData = {
            cam_name: newCam.name,
            stream_url: newCam.url,
            loc_id: parseInt(newCam.locId)
        };
        try {
            const data = await fetchApi('/cameras', 'POST', cameraData);
            if (data.status === 'success') {
                setCamMessage({ text: 'Camera added successfully!', type: 'success' });
                setNewCam({ name: '', url: '', locId: locations[0]?.id || '' });
                fetchCameras();
            } else {
                setCamMessage({ text: `Error: ${data.message}`, type: 'error' });
            }
        } catch (error) {
            setCamMessage({ text: `Error: ${error.message}`, type: 'error' });
        }
    };

    const handleDeleteCamera = async (camId) => {
        if (!window.confirm('Are you sure you want to delete this camera? This cannot be undone.')) {
            return;
        }
        setCamMessage({ text: '', type: '' });
        try {
            const data = await fetchApi(`/cameras/${camId}`, 'DELETE');
            if (data.status === 'success') {
                setCamMessage({ text: 'Camera removed successfully!', type: 'success' });
                fetchCameras();
            } else {
                setCamMessage({ text: `Error: ${data.message}`, type: 'error' });
            }
        } catch (error) {
            setCamMessage({ text: `Error: ${error.message}`, type: 'error' });
        }
    };

    const messageClass = (msg) => msg.type === 'success'
        ? 'bg-green-100 border-green-400 text-green-700'
        : 'bg-red-100 border-red-400 text-red-700';

    return (
        <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-200 mt-12 max-w-4xl">
            <h2 className="text-2xl font-semibold text-gray-800 flex items-center mb-4 pb-2 border-b">
                <FaCamera className="mr-2 text-gray-500" /> Camera Management
            </h2>

            {camMessage.text && (
                <div className={`mb-6 p-4 border rounded-xl font-medium ${messageClass(camMessage)}`}>
                    {camMessage.text}
                </div>
            )}

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
                        className="w-full flex items-center justify-center bg-green-600 text-white font-bold py-2 px-4 rounded-xl hover:bg-green-700 h-10"
                    >
                        <FaPlus className="mr-2" /> Add
                    </button>
                </div>
            </form>
            
            <h3 className="text-lg font-semibold text-gray-700 mb-2">Existing Cameras</h3>
            <div className="space-y-2">
                {cameras.length === 0 ? <p className="text-gray-500">No cameras added yet.</p> : null}
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
    );
}