// src/components/CameraManager.jsx

import React, { useState, useEffect } from 'react';
import { fetchApi } from '../services/apiService';
import { FaCamera, FaTrash, FaPlus, FaPencilAlt, FaSave, FaTimes, FaCameraRetro } from 'react-icons/fa';

// This component manages adding, editing, and removing cameras
export default function CameraManager({ locations, onCameraUpdated }) {
    const [cameras, setCameras] = useState([]);
    const [newCam, setNewCam] = useState({ name: '', url: '', locId: '' });
    const [camMessage, setCamMessage] = useState({ text: '', type: '' });

    // State to track the camera being edited
    const [editingCam, setEditingCam] = useState(null);

    // --- NEW STATE FOR MODAL ---
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [cameraToDeleteId, setCameraToDeleteId] = useState(null);
    // ---------------------------

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

    const handleDeleteCamera = (camId) => {
        setCameraToDeleteId(camId);
        setIsDeleteModalOpen(true);
    };

    const confirmDelete = async () => {
        if (!cameraToDeleteId) {
            return;
        }

        setIsDeleteModalOpen(false);
        setCamMessage({ text: '', type: '' }); 

        try {
            const data = await fetchApi(`/cameras/${cameraToDeleteId}`, 'DELETE');
            if (data.status === 'success') {
                setCamMessage({ text: 'Camera removed successfully!', type: 'success' });
                await fetchCameras();
            } else {
                setCamMessage({ text: `Error: ${data.message}`, type: 'error' });
            }
        } catch (error) {
            setCamMessage({ text: `Error: ${error.message}`, type: 'error' });
        } finally {
            setCameraToDeleteId(null);
        }
    };

    const handleEditCamera = (cam) => {
        setEditingCam({
            ...cam,
            cam_name: cam.name,
            stream_url: cam.stream_url || '', 
            loc_id: cam.location_id
        });
    };

    const handleEditChange = (e) => {
        const { name, value } = e.target;
        setEditingCam(prev => ({ ...prev, [name]: value }));
    };

    const handleCancelEdit = () => {
        setEditingCam(null);
    };

    const handleUpdateCamera = async (e) => {
        e.preventDefault();
        setCamMessage({ text: '', type: '' });

        if (!editingCam.cam_name.trim()) {
            setCamMessage({ text: 'Camera name cannot be empty.', type: 'error' });
            return;
        }

        const cameraData = {
            cam_name: editingCam.cam_name,
            stream_url: editingCam.stream_url,
            loc_id: parseInt(editingCam.loc_id)
        };

        try {
            const data = await fetchApi(`/cameras/${editingCam.id}`, 'PATCH', cameraData);
            if (data.status === 'success') {
                setCamMessage({ text: 'Camera updated successfully!', type: 'success' });
                setEditingCam(null);
                await fetchCameras();
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

    const cameraName = cameras.find(c => c.id === cameraToDeleteId)?.name || 'this camera';

    return (
        // Outer container structure from your previous version
        <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-200 mt-12 max-w-4xl"> 
            
            {/* Heading */}
            <h2 className="text-2xl font-semibold text-gray-800 flex items-center mb-4 pb-2 border-b">
                <FaCamera className="mr-2 text-teal-700" /> Camera Management
            </h2>

            {camMessage.text && (
                <div className={`mb-6 p-4 border rounded-xl font-medium ${messageClass(camMessage)}`}>
                    {camMessage.text}
                </div>
            )}

            {/* --- Add Camera Form --- */}
            <h3 className="text-lg font-semibold text-gray-700 mb-2 px-3">Add New Camera</h3>
            <form onSubmit={handleAddCamera} className="grid grid-cols-1 md:grid-cols-5 gap-4 items-end mb-4 px-3"> 
                {/* Camera Name (col-span-2) */}
                <div className="col-span-2"> 
                    <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="name">New Camera Name</label>
                    <input
                        type="text" id="name" name="name" value={newCam.name}
                        onChange={handleNewCamChange}
                        className="w-full border-gray-300 rounded-lg shadow-sm focus:ring-teal-500 focus:border-teal-500 pl-2 py-1" 
                        required
                    />
                </div>
                
                {/* Stream URL (col-span-2) */}
                <div className="col-span-2"> 
                    <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="url">Stream URL</label>
                    <input
                        type="url" id="url" name="url" value={newCam.url}
                        onChange={handleNewCamChange}
                        className="w-full border-gray-300 rounded-lg shadow-sm focus:ring-teal-500 focus:border-teal-500 pl-2 py-1" 
                        required // Stream URL is mandatory
                    />
                </div>
                
                {/* Location (col-span-1) */}
                <div className="col-span-1">
                    <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="locId">Location</label>
                    <select
                        id="locId" name="locId" value={newCam.locId}
                        onChange={handleNewCamChange}
                        className="w-full border-gray-300 rounded-lg shadow-sm focus:ring-teal-500 focus:border-teal-500 pl-2 py-1" 
                        required
                    >
                        {locations.length === 0 && <option value="">Loading locations...</option>}
                        {locations.map(loc => (<option key={loc.id} value={loc.id}>{loc.name}</option>))}
                    </select>
                </div>
                
                {/* Add Button */}
                <div className="col-span-5 md:col-span-1 flex justify-end"> 
                    <button
                        type="submit"
                        className="w-full flex items-center justify-center bg-green-600 text-white font-bold py-2 px-4 rounded-xl hover:bg-green-700 h-10"
                    >
                        Add
                    </button>
                </div>
            </form>

            <h3 className="text-lg font-semibold text-gray-700 mb-2 px-3">Existing Cameras</h3>
            
            {/* 🛑 SCROLLABLE WRAPPER: Added max-h-72 and overflow-y-auto */}
            <div className="space-y-2 max-h-72 overflow-y-auto px-3 pr-2"> 
                {cameras.length === 0 ? <p className="text-gray-500">No cameras added yet.</p> : null}
                {cameras.map(cam => (
                    <div key={cam.id} className="p-3 border rounded-lg bg-gray-50">
                        {editingCam && editingCam.id === cam.id ? (
                            /* --- Edit Mode --- */
                            <form onSubmit={handleUpdateCamera} className="space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4"> 
                                    {/* Camera Name */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor={`edit-cam-name-${cam.id}`}>Camera Name</label>
                                        <input
                                            type="text" id={`edit-cam-name-${cam.id}`} name="cam_name"
                                            value={editingCam.cam_name} onChange={handleEditChange}
                                            className="w-full border-gray-300 rounded-lg shadow-sm focus:ring-teal-500 focus:border-teal-500 pl-2 py-1" required
                                        />
                                    </div>
                                    {/* Stream URL */}
                                    <div> 
                                        <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor={`edit-url-${cam.id}`}>Stream URL</label>
                                        <input
                                            type="url" id={`edit-url-${cam.id}`} name="stream_url"
                                            value={editingCam.stream_url || ''} onChange={handleEditChange}
                                            className="w-full border-gray-300 rounded-lg shadow-sm focus:ring-teal-500 focus:border-teal-500 pl-2 py-1"
                                            required
                                        />
                                    </div>
                                    {/* Location */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor={`edit-loc-id-${cam.id}`}>Location</label>
                                        <select
                                            id={`edit-loc-id-${cam.id}`} name="loc_id"
                                            value={editingCam.loc_id} onChange={handleEditChange}
                                            className="w-full border-gray-300 rounded-lg shadow-sm focus:ring-teal-500 focus:border-teal-500 pl-2 py-1" required
                                        >
                                            {locations.map(loc => (<option key={loc.id} value={loc.id}>{loc.name}</option>))}
                                        </select>
                                    </div>
                                </div>
                                <div className="flex justify-end gap-2">
                                    <button
                                        type="button"
                                        onClick={handleCancelEdit}
                                        className="flex items-center bg-gray-500 text-white text-sm font-bold py-1 px-3 rounded-lg hover:bg-gray-600"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        className="flex items-center bg-green-600 text-white text-sm font-bold py-1 px-3 rounded-lg hover:bg-green-700"
                                    >
                                        Save
                                    </button>
                                </div>
                            </form>
                        ) : (
                            /* --- View Mode --- */
                            <div className="flex justify-between items-center">
                                <div>
                                    <strong className="text-gray-900">{cam.name}</strong>
                                    <span className="text-gray-600 text-sm ml-2">(Location: {cam.location_name || 'N/A'})</span>
                                    <div className="text-xs text-gray-500 truncate mt-1">
                                        URL: {cam.stream_url || 'N/A'}
                                    </div>
                                </div>
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => handleEditCamera(cam)}
                                        className="flex items-center bg-blue-600 text-white text-sm font-bold py-1 px-3 rounded-lg hover:bg-blue-700"
                                    >
                                        Edit
                                    </button>
                                    <button
                                        onClick={() => handleDeleteCamera(cam.id)}
                                        className="flex items-center bg-red-600 text-white text-sm font-bold py-1 px-3 rounded-lg hover:bg-red-700"
                                    >
                                        Remove
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                ))}
            </div>

            {/* --------------------------- DELETE CONFIRMATION MODAL --------------------------- */}
            {isDeleteModalOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-md">
                        <div className="p-6 border-b border-gray-200">
                            <h4 className="text-xl font-bold text-red-600 flex items-center">
                                Confirm Deletion
                            </h4>
                        </div>
                        <div className="p-6">
                            <p className="text-gray-700 mb-6">
                                Are you sure you want to delete <strong className="font-semibold">{cameraName}</strong>?
                                <br/>
                                <strong className="text-red-700">This action cannot be undone.</strong>
                            </p>
                            <div className="flex justify-end space-x-3">
                                <button
                                    onClick={() => setIsDeleteModalOpen(false)}
                                    className="px-4 py-2 text-sm font-medium rounded-lg border border-gray-300 text-gray-700 bg-white hover:bg-gray-50"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={confirmDelete}
                                    className="px-4 py-2 text-sm font-medium rounded-lg text-white bg-red-600 hover:bg-red-700"
                                >
                                    Delete Camera
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
            {/* --------------------------------------------------------------------------------- */}
        </div>
    );
}