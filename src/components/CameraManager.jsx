import React, { useState, useEffect } from 'react';
import { fetchApi } from '../services/apiService'; 
import { 
    FaCamera, 
    FaTrash, 
    FaPlus,
    FaPencilAlt, 
    FaSave,      
    FaTimes      
} from 'react-icons/fa';

// This component manages adding, editing, and removing cameras
export default function CameraManager({ locations, onCameraUpdated }) {
    const [cameras, setCameras] = useState([]);
    const [newCam, setNewCam] = useState({ name: '', url: '', locId: '' });
    const [camMessage, setCamMessage] = useState({ text: '', type: '' });
    
    // State to track the camera being edited
    const [editingCam, setEditingCam] = useState(null); 

    // Fetch cameras on mount
    useEffect(() => {
        fetchCameras();
    }, []);

    // When locations prop updates, set the default for the dropdown
    useEffect(() => {
        if (locations.length > 0 && !newCam.locId) {
            setNewCam(prev => ({ ...prev, locId: locations[0].id }));
        }
    }, [locations, newCam.locId]);

    const fetchCameras = async () => {
        try {
            const data = await fetchApi('/cameras', 'GET');
            if (data.status === 'success') {
                setCameras(data.cameras);
                if (onCameraUpdated) { // Notify parent
                    onCameraUpdated();
                }
            }
        } catch (err) {
            console.error("Error fetching cameras:", err);
            setCamMessage({ text: `Failed to load cameras: ${err.message}`, type: 'error' });
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
                await fetchCameras(); 
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
                await fetchCameras(); 
            } else {
                setCamMessage({ text: `Error: ${data.message}`, type: 'error' });
            }
        } catch (error) {
            setCamMessage({ text: `Error: ${error.message}`, type: 'error' });
        }
    };

    // --- NEW: Handlers for editing a camera ---
    
    // 1. When "Edit" is clicked, set the camera to editing state
    const handleEditCamera = (cam) => {
        // We must map the backend 'location_id' to 'locId' for our form state
        setEditingCam({ 
            ...cam, 
            cam_name: cam.name, // Use 'name' from the fetched list
            loc_id: cam.location_id // Use 'location_id' from the fetched list
        });
    };

    // 2. When an edit form field changes, update state
    const handleEditChange = (e) => {
        const { name, value } = e.target;
        setEditingCam(prev => ({ ...prev, [name]: value }));
    };

    // 3. When "Cancel" is clicked, clear editing state
    const handleCancelEdit = () => {
        setEditingCam(null);
    };

    // 4. When "Save" is clicked, send a PATCH request
    const handleUpdateCamera = async (e) => {
        e.preventDefault();
        setCamMessage({ text: '', type: '' });

        if (!editingCam.cam_name.trim()) {
            setCamMessage({ text: 'Camera name cannot be empty.', type: 'error' });
            return;
        }

        const cameraData = {
            cam_name: editingCam.cam_name,
            loc_id: parseInt(editingCam.loc_id)
            // You could add stream_url here too if you add it to the edit form
        };

        try {
            const data = await fetchApi(`/cameras/${editingCam.id}`, 'PATCH', cameraData);
            if (data.status === 'success') {
                setCamMessage({ text: 'Camera updated successfully!', type: 'success' });
                setEditingCam(null); // Exit edit mode
                await fetchCameras(); // Await to refresh the list
            } else {
                setCamMessage({ text: `Error: ${data.message}`, type: 'error' });
            }
        } catch (error) {
            setCamMessage({ text: `Error: ${error.message}`, type: 'error' });
        }
    };
    // --- END NEW HANDLERS ---

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

            {/* --- Add Camera Form --- */}
            <h3 className="text-lg font-semibold text-gray-700 mb-2">Add New Camera</h3>
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
                        {locations.length === 0 && <option value="">Loading locations...</option>}
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
                    <div key={cam.id} className="p-3 border rounded-lg bg-gray-50">
                        {editingCam && editingCam.id === cam.id ? (
                            // --- NEW: Edit Mode ---
                            <form onSubmit={handleUpdateCamera} className="space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor={`edit-cam-name-${cam.id}`}>Camera Name</label>
                                        <input
                                            type="text"
                                            id={`edit-cam-name-${cam.id}`}
                                            name="cam_name" // Corresponds to editingCam state
                                            value={editingCam.cam_name}
                                            onChange={handleEditChange}
                                            className="w-full border-gray-300 rounded-lg shadow-sm focus:ring-teal-500 focus:border-teal-500"
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor={`edit-loc-id-${cam.id}`}>Location</label>
                                        <select
                                            id={`edit-loc-id-${cam.id}`}
                                            name="loc_id" // Corresponds to editingCam state
                                            value={editingCam.loc_id}
                                            onChange={handleEditChange}
                                            className="w-full border-gray-300 rounded-lg shadow-sm focus:ring-teal-500 focus:border-teal-500"
                                            required
                                        >
                                            {locations.map(loc => (
                                                <option key={loc.id} value={loc.id}>{loc.name}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                                <div className="flex justify-end gap-2">
                                    <button
                                        type="button"
                                        onClick={handleCancelEdit}
                                        className="flex items-center bg-gray-500 text-white text-sm font-bold py-1 px-3 rounded-lg hover:bg-gray-600"
                                    >
                                        <FaTimes className="mr-1" /> Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        className="flex items-center bg-green-600 text-white text-sm font-bold py-1 px-3 rounded-lg hover:bg-green-700"
                                    >
                                        <FaSave className="mr-1" /> Save
                                    </button>
                                </div>
                            </form>
                        ) : (
                            // --- View Mode ---
                            <div className="flex justify-between items-center">
                                <div>
                                    <strong className="text-gray-900">{cam.name}</strong>
                                    <span className="text-gray-600 text-sm ml-2">(Location: {cam.location_name || 'N/A'})</span>
                                </div>
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => handleEditCamera(cam)} // <-- NEW Edit button
                                        className="flex items-center bg-blue-600 text-white text-sm font-bold py-1 px-3 rounded-lg hover:bg-blue-700"
                                    >
                                        <FaPencilAlt className="mr-1" /> Edit
                                    </button>
                                    <button
                                        onClick={() => handleDeleteCamera(cam.id)}
                                        className="flex items-center bg-red-600 text-white text-sm font-bold py-1 px-3 rounded-lg hover:bg-red-700"
                                    >
                                        <FaTrash className="mr-1" /> Remove
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
}