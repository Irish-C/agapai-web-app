// src/features/manager/CameraManager.jsx - REDESIGNED with Card Grid & Tabs
import React, { useState, useEffect } from 'react';
import { fetchApi } from '../../services/apiService';
import { FaTrash, FaPlus, FaPencilAlt, FaSave, FaTimes, FaCameraRetro, FaGlobe, FaMapMarkerAlt, FaToggleOn, FaToggleOff } from 'react-icons/fa';

export default function CameraManager({ locations: initialLocations, onCameraUpdated }) {
    const [cameras, setCameras] = useState([]);
    const [newCam, setNewCam] = useState({ name: '', url: '', locId: '' });
    const [camMessage, setCamMessage] = useState({ text: '', type: '' });
    const [activeTab, setActiveTab] = useState('list');
    const [editingCam, setEditingCam] = useState(null);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [cameraToDeleteId, setCameraToDeleteId] = useState(null);
    const [isPublishModalOpen, setIsPublishModalOpen] = useState(false);
    const [publishCameraId, setPublishCameraId] = useState(null);
    
    // Location state
    const [locations, setLocations] = useState(initialLocations || []);
    const [newLocName, setNewLocName] = useState('');
    const [editingLoc, setEditingLoc] = useState(null);
    const [locMessage, setLocMessage] = useState({ text: '', type: '' });
    const [isDeleteLocModalOpen, setIsDeleteLocModalOpen] = useState(false);
    const [locationToDeleteId, setLocationToDeleteId] = useState(null);
    
    const [publishedCameras, setPublishedCameras] = useState(() => {
        try {
            const stored = localStorage.getItem('publishedCameras');
            return stored ? new Set(JSON.parse(stored)) : new Set();
        } catch (e) {
            return new Set();
        }
    });

    useEffect(() => {
        try {
            localStorage.setItem('publishedCameras', JSON.stringify(Array.from(publishedCameras)));
        } catch (e) {
            console.error('Failed to save published cameras to localStorage:', e);
        }
    }, [publishedCameras]);

    useEffect(() => {
        fetchCameras();
        fetchLocations();
    }, []);

    useEffect(() => {
        if (locations.length > 0 && !newCam.locId) {
            setNewCam(prev => ({ ...prev, locId: locations[0].id }));
        }
    }, [locations, newCam.locId]);

    useEffect(() => {
        if (editingCam && !editingCam.loc_id && locations.length > 0) {
            setEditingCam(prev => ({ ...prev, loc_id: locations[0].id }));
        }
    }, [locations, editingCam]);

    const fetchCameras = async () => {
        try {
            const data = await fetchApi('/cameras', 'GET'); 
            if (data.status === 'success') {
                setCameras(data.cameras);
                if (onCameraUpdated) onCameraUpdated();
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
            loc_id: parseInt(newCam.locId),
        };
        try {
            const data = await fetchApi('/cameras', 'POST', cameraData);
            if (data.status === 'success') {
                setCamMessage({ text: 'Camera added successfully!', type: 'success' });
                setNewCam({ name: '', url: '', locId: locations[0]?.id || '' });
                setActiveTab('list');
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
        if (!cameraToDeleteId) return;
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
        if (!locations || locations.length === 0) {
            setCamMessage({ text: 'Locations are still loading. Please try again shortly.', type: 'error' });
            return;
        }
        const defaultLocId = locations[0].id;
        setEditingCam({
            ...cam,
            cam_name: cam.name,
            stream_url: cam.stream_url || '',
            loc_id: cam.location_id ?? defaultLocId,
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
        const locId = parseInt(editingCam.loc_id) || locations[0]?.id;
        if (!locId) {
            setCamMessage({ text: 'Please select a location before saving.', type: 'error' });
            return;
        }
        const cameraData = {
            cam_name: editingCam.cam_name,
            stream_url: editingCam.stream_url,
            loc_id: locId,
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

    const handlePublish = (cam) => {
        setPublishCameraId(cam.id);
        setIsPublishModalOpen(true);
    };

    const confirmPublish = async () => {
        if (!publishCameraId) return;
        setIsPublishModalOpen(false);
        setCamMessage({ text: '', type: '' });
        const isPublished = publishedCameras.has(publishCameraId);
        const endpoint = isPublished ? `unpublish` : `publish`;
        const action = isPublished ? 'Unpublished' : 'Published';
        try {
            const data = await fetchApi(`/cameras/${publishCameraId}/${endpoint}`, 'POST');
            if (data && (data.status === 'ok' || data.status === 'success')) {
                setPublishedCameras((prev) => {
                    const updated = new Set(prev);
                    isPublished ? updated.delete(publishCameraId) : updated.add(publishCameraId);
                    return updated;
                });
                setCamMessage({ text: `${action} successfully: ${data.webrtc || data.hls || data.message || ''}`, type: 'success' });
            } else {
                setCamMessage({ text: `${action} request succeeded.`, type: 'success' });
                setPublishedCameras((prev) => {
                    const updated = new Set(prev);
                    isPublished ? updated.delete(publishCameraId) : updated.add(publishCameraId);
                    return updated;
                });
            }
        } catch (err) {
            setCamMessage({ text: `${action} failed: ${err?.message || err}`, type: 'error' });
        } finally {
            setPublishCameraId(null);
        }
    };

    // Location Functions
    const fetchLocations = async () => {
        try {
            const data = await fetchApi('/locations', 'GET');
            if (data.status === 'success') {
                setLocations(data.locations);
            }
        } catch (err) {
            console.error("Error fetching locations:", err);
            setLocMessage({ text: `Failed to load locations: ${err.message}`, type: 'error' });
        }
    };

    const handleAddLocation = async (e) => {
        e.preventDefault();
        setLocMessage({ text: '', type: '' });
        if (!newLocName.trim()) {
            setLocMessage({ text: 'Location name cannot be empty.', type: 'error' });
            return;
        }
        try {
            const data = await fetchApi('/locations', 'POST', { loc_name: newLocName });
            if (data.status === 'success') {
                setLocMessage({ text: 'Location added successfully!', type: 'success' });
                setNewLocName('');
                await fetchLocations();
            } else {
                setLocMessage({ text: `Error: ${data.message}`, type: 'error' });
            }
        } catch (error) {
            setLocMessage({ text: `Error: ${error.message}`, type: 'error' });
        }
    };

    const handleEditLocation = (loc) => {
        setEditingLoc({ ...loc });
    };

    const handleUpdateLocation = async (e) => {
        e.preventDefault();
        setLocMessage({ text: '', type: '' });
        if (!editingLoc.name.trim()) {
            setLocMessage({ text: 'Location name cannot be empty.', type: 'error' });
            return;
        }
        try {
            const data = await fetchApi(`/locations/${editingLoc.id}`, 'PATCH', { 
                loc_name: editingLoc.name 
            });
            if (data.status === 'success') {
                setLocMessage({ text: 'Location updated successfully!', type: 'success' });
                setEditingLoc(null);
                await fetchLocations();
            } else {
                setLocMessage({ text: `Error: ${data.message}`, type: 'error' });
            }
        } catch (error) {
            setLocMessage({ text: `Error: ${error.message}`, type: 'error' });
        }
    };

    const handleDeleteLocation = (locId) => {
        setLocationToDeleteId(locId);
        setIsDeleteLocModalOpen(true);
    };

    const confirmDeleteLocation = async () => {
        if (!locationToDeleteId) return;
        setIsDeleteLocModalOpen(false);
        setLocMessage({ text: '', type: '' });
        try {
            const data = await fetchApi(`/locations/${locationToDeleteId}`, 'DELETE');
            if (data.status === 'success') {
                setLocMessage({ text: 'Location removed successfully!', type: 'success' });
                await fetchLocations();
            } else {
                setLocMessage({ text: `Error: ${data.message}`, type: 'error' });
            }
        } catch (error) {
            setLocMessage({ text: `Error: ${error.message}`, type: 'error' });
        } finally {
            setLocationToDeleteId(null);
        }
    };

    const messageClass = (msg) => msg.type === 'success'
        ? 'bg-green-100 border-green-400 text-green-700'
        : 'bg-red-100 border-red-400 text-red-700';

    const cameraName = cameras.find(c => c.id === cameraToDeleteId)?.name || 'this camera';
    const locationName = locations.find(loc => loc.id === locationToDeleteId)?.name || 'this location';

    return (
        <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-200">
            <div className="flex items-center justify-between mb-6 pb-4 border-b">
                <h2 className="text-2xl font-bold text-gray-900 flex items-center">
                    <FaCameraRetro className="mr-3 text-cyan-600" /> Camera Management
                </h2>
            </div>

            {camMessage.text && (
                <div className={`mb-6 p-4 border rounded-lg font-medium ${messageClass(camMessage)}`}>
                    {camMessage.text}
                </div>
            )}

            <div className="flex gap-2 mb-6 border-b">
                <button
                    onClick={() => setActiveTab('list')}
                    className={`px-4 py-2 font-semibold transition-colors ${
                        activeTab === 'list'
                            ? 'text-cyan-600 border-b-2 border-cyan-600'
                            : 'text-gray-600 hover:text-gray-900'
                    }`}
                >
                    Camera List ({cameras.length})
                </button>
                <button
                    onClick={() => setActiveTab('add')}
                    className={`px-4 py-2 font-semibold transition-colors ${
                        activeTab === 'add'
                            ? 'text-cyan-600 border-b-2 border-cyan-600'
                            : 'text-gray-600 hover:text-gray-900'
                    }`}
                >
                    Add Camera
                </button>
                <button
                    onClick={() => setActiveTab('locations')}
                    className={`px-4 py-2 font-semibold transition-colors ${
                        activeTab === 'locations'
                            ? 'text-cyan-600 border-b-2 border-cyan-600'
                            : 'text-gray-600 hover:text-gray-900'
                    }`}
                >
                    Locations ({locations.length})
                </button>
            </div>

            {activeTab === 'list' && (
                <div>
                    {cameras.length === 0 ? (
                        <div className="py-12 text-center text-gray-500">
                            <FaCameraRetro className="text-5xl mx-auto mb-3 opacity-30" />
                            <p className="text-lg">No cameras yet. Click "Add Camera" to get started.</p>
                        </div>
                    ) : (
                        <div className="max-h-screen overflow-y-auto pr-2">
                            <table className="w-full border-collapse" style={{ tableLayout: 'fixed' }}>
                                <thead>
                                    <tr className="bg-gray-200 sticky top-0">
                                        <th className="px-4 py-3 text-left font-semibold text-gray-900 w-1/4">Camera Name</th>
                                        <th className="px-4 py-3 text-left font-semibold text-gray-900 w-1/4">Location</th>
                                        <th className="px-4 py-3 text-left font-semibold text-gray-900 w-3/10">Stream URL</th>
                                        <th className="px-4 py-3 text-center font-semibold text-gray-900 w-1/5">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {cameras.map((cam, index) => (
                                        <React.Fragment key={cam.id}>
                                            <tr className={` transition-colors ${
                                                index % 2 === 0 ? 'bg-white' : 'bg-gray-100'
                                            } hover:bg-gray-200`}>
                                                <td className="px-4 py-3 text-gray-900 font-semibold w-1/4 overflow-hidden">
                                                    {cam.name}
                                                </td>
                                                <td className="px-4 py-3 text-gray-700 w-1/4 overflow-hidden">
                                                    {cam.location_name || 'Unknown'}
                                                </td>
                                                <td className="px-4 py-3 text-gray-600 text-sm w-3/10 overflow-hidden">
                                                    <span className="truncate block">{cam.stream_url}</span>
                                                </td>
                                                <td className="px-4 py-3 w-1/5">
                                                    {editingCam && editingCam.id === cam.id ? (
                                                        <div className="flex gap-1 justify-center whitespace-nowrap">
                                                            <button
                                                                onClick={() => {}}
                                                                className="bg-green-600 text-white text-xs py-1 px-2 rounded hover:bg-green-700 font-semibold"
                                                            >
                                                                Save
                                                            </button>
                                                            <button
                                                                type="button"
                                                                onClick={handleCancelEdit}
                                                                className="bg-gray-500 text-white text-xs py-1 px-2 rounded hover:bg-gray-600 font-semibold"
                                                            >
                                                                Cancel
                                                            </button>
                                                        </div>
                                                    ) : (
                                                        <div className="flex gap-1 justify-center whitespace-nowrap">
                                                            <button
                                                                onClick={() => handleEditCamera(cam)}
                                                                disabled={locations.length === 0}
                                                                className="bg-blue-600 text-white text-xs py-1 px-2 rounded hover:bg-blue-700 font-semibold disabled:opacity-50"
                                                            >
                                                                Edit
                                                            </button>
                                                            <button
                                                                onClick={() => handleDeleteCamera(cam.id)}
                                                                className="bg-red-600 text-white text-xs py-1 px-2 rounded hover:bg-red-700 font-semibold"
                                                            >
                                                                Delete
                                                            </button>
                                                            <button
                                                                onClick={() => handlePublish(cam)}
                                                                className={`text-white text-xs py-1 px-2 rounded font-semibold ${
                                                                    publishedCameras.has(cam.id)
                                                                        ? 'bg-gray-600 hover:bg-gray-700'
                                                                        : 'bg-yellow-600 hover:bg-yellow-700'
                                                                }`}
                                                            >
                                                                {publishedCameras.has(cam.id) ? 'Unpublish' : 'Publish'}
                                                            </button>
                                                        </div>
                                                    )}
                                                </td>
                                            </tr>
                                            {editingCam && editingCam.id === cam.id && (
                                                <tr className={index % 2 === 0 ? 'bg-white' : 'bg-gray-100'}>
                                                    <td colSpan="4" className="px-4 py-3">
                                                        <form onSubmit={handleUpdateCamera} className="space-y-3 bg-blue-50 p-4 rounded-lg border border-blue-200">
                                                            <div className="grid grid-cols-3 gap-4">
                                                                <div>
                                                                    <label className="text-sm font-semibold text-gray-700">Camera Name</label>
                                                                    <input
                                                                        type="text"
                                                                        name="cam_name"
                                                                        value={editingCam.cam_name}
                                                                        onChange={handleEditChange}
                                                                        className="mt-1 w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                                                                        placeholder="Camera name"
                                                                        required
                                                                    />
                                                                </div>
                                                                <div>
                                                                    <label className="text-sm font-semibold text-gray-700">Stream URL</label>
                                                                    <input
                                                                        type="url"
                                                                        name="stream_url"
                                                                        value={editingCam.stream_url || ''}
                                                                        onChange={handleEditChange}
                                                                        className="mt-1 w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                                                                        placeholder="Stream URL"
                                                                        required
                                                                    />
                                                                </div>
                                                                <div>
                                                                    <label className="text-sm font-semibold text-gray-700">Location</label>
                                                                    <select
                                                                        name="loc_id"
                                                                        value={editingCam.loc_id}
                                                                        onChange={handleEditChange}
                                                                        className="mt-1 w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                                                                        required
                                                                    >
                                                                        {locations.map(l => (<option key={l.id} value={l.id}>{l.name}</option>))}
                                                                    </select>
                                                                </div>
                                                            </div>
                                                            <div className="flex gap-2 justify-end">
                                                                <button type="submit" className="bg-green-600 text-white py-2 px-6 rounded-lg hover:bg-green-700 text-sm font-semibold flex items-center">
                                                                    <FaSave className="mr-2" /> Save
                                                                </button>
                                                                <button type="button" onClick={handleCancelEdit} className="bg-gray-500 text-white py-2 px-6 rounded-lg hover:bg-gray-600 text-sm font-semibold">
                                                                    Cancel
                                                                </button>
                                                            </div>
                                                        </form>
                                                    </td>
                                                </tr>
                                            )}
                                        </React.Fragment>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            )}

            {activeTab === 'add' && (
                <form onSubmit={handleAddCamera} className="space-y-4 max-w-lg">
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Camera Name *</label>
                        <input
                            type="text"
                            name="name"
                            value={newCam.name}
                            onChange={handleNewCamChange}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                            placeholder="e.g., Hallway Camera 1"
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Stream URL *</label>
                        <input
                            type="url"
                            name="url"
                            value={newCam.url}
                            onChange={handleNewCamChange}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                            placeholder="rtsp://..."
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Location *</label>
                        <select
                            name="locId"
                            value={newCam.locId}
                            onChange={handleNewCamChange}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                            required
                        >
                            {locations.length === 0 && <option value="">Loading locations...</option>}
                            {locations.map(loc => (<option key={loc.id} value={loc.id}>{loc.name}</option>))}
                        </select>
                    </div>
                    <div className="flex gap-3">
                        <button
                            type="submit"
                            className="flex-1 bg-green-600 text-white py-3 rounded-lg hover:bg-green-700 font-bold flex items-center justify-center"
                        >
                            <FaPlus className="mr-2" /> Add Camera
                        </button>
                        <button
                            type="button"
                            onClick={() => setActiveTab('list')}
                            className="flex-1 bg-gray-500 text-white py-3 rounded-lg hover:bg-gray-600 font-bold"
                        >
                            Cancel
                        </button>
                    </div>
                </form>
            )}

            {activeTab === 'locations' && (
                <div>
                    {locMessage.text && (
                        <div className={`mb-6 p-4 border rounded-lg font-medium ${messageClass(locMessage)}`}>
                            {locMessage.text}
                        </div>
                    )}

                    <form onSubmit={handleAddLocation} className="mb-6">
                        <div className="flex gap-3">
                            <input
                                type="text"
                                value={newLocName}
                                onChange={(e) => setNewLocName(e.target.value)}
                                className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                placeholder="e.g., Main Lobby, Dining Hall..."
                                required
                            />
                            <button
                                type="submit"
                                className="px-6 py-3 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 flex items-center whitespace-nowrap"
                            >
                                Add
                            </button>
                        </div>
                    </form>

                    {locations.length === 0 ? (
                        <div className="py-12 text-center text-gray-500">
                            <FaMapMarkerAlt className="text-5xl mx-auto mb-3 opacity-30" />
                            <p className="text-lg">No locations yet. Add one above to get started.</p>
                        </div>
                    ) : (
                        <div className="max-h-screen overflow-y-auto pr-2">
                            <table className="w-full border-collapse" style={{ tableLayout: 'fixed' }}>
                                <thead>
                                    <tr className="bg-gray-200 sticky top-0">
                                        <th className="px-4 py-3 text-left font-semibold text-gray-900 w-4/5">Location Name</th>
                                        <th className="px-4 py-3 text-center font-semibold text-gray-900 w-1/5">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {locations.map((loc, index) => (
                                        <React.Fragment key={loc.id}>
                                            <tr className={` transition-colors ${
                                                index % 2 === 0 ? 'bg-white' : 'bg-gray-100'
                                            } hover:bg-gray-200`}>
                                                <td className="px-4 py-3 text-gray-900 font-semibold w-4/5 overflow-hidden">
                                                    {loc.name}
                                                </td>
                                                <td className="px-4 py-3 w-1/5">
                                                    {editingLoc && editingLoc.id === loc.id ? (
                                                        <div className="flex gap-1 justify-center whitespace-nowrap">
                                                            <button
                                                                type="submit"
                                                                onClick={handleUpdateLocation}
                                                                className="bg-green-600 text-white text-xs py-1 px-2 rounded hover:bg-green-700 font-semibold"
                                                            >
                                                                Save
                                                            </button>
                                                            <button
                                                                type="button"
                                                                onClick={() => setEditingLoc(null)}
                                                                className="bg-gray-500 text-white text-xs py-1 px-2 rounded hover:bg-gray-600 font-semibold"
                                                            >
                                                                Cancel
                                                            </button>
                                                        </div>
                                                    ) : (
                                                        <div className="flex gap-1 justify-center whitespace-nowrap">
                                                            <button
                                                                onClick={() => handleEditLocation(loc)}
                                                                className="bg-blue-600 text-white text-xs py-1 px-2 rounded hover:bg-blue-700 font-semibold"
                                                            >
                                                                Edit
                                                            </button>
                                                            <button
                                                                onClick={() => handleDeleteLocation(loc.id)}
                                                                className="bg-red-600 text-white text-xs py-1 px-2 rounded hover:bg-red-700 font-semibold"
                                                            >
                                                                Delete
                                                            </button>
                                                        </div>
                                                    )}
                                                </td>
                                            </tr>
                                            {editingLoc && editingLoc.id === loc.id && (
                                                <tr className={index % 2 === 0 ? 'bg-white' : 'bg-gray-100'}>
                                                    <td colSpan="2" className="px-4 py-3">
                                                        <form onSubmit={handleUpdateLocation} className="space-y-3 bg-blue-50 p-4 rounded-lg border border-blue-200">
                                                            <div>
                                                                <label className="text-sm font-semibold text-gray-700">Location Name</label>
                                                                <input
                                                                    type="text"
                                                                    value={editingLoc.name}
                                                                    onChange={(e) => setEditingLoc(prev => ({ ...prev, name: e.target.value }))}
                                                                    className="mt-1 w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                                                                    placeholder="Location name"
                                                                    required
                                                                />
                                                            </div>
                                                            <div className="flex gap-2 justify-end">
                                                                <button type="submit" className="bg-green-600 text-white py-2 px-6 rounded-lg hover:bg-green-700 text-sm font-semibold">
                                                                    Save
                                                                </button>
                                                                <button type="button" onClick={() => setEditingLoc(null)} className="bg-gray-500 text-white py-2 px-6 rounded-lg hover:bg-gray-600 text-sm font-semibold">
                                                                    Cancel
                                                                </button>
                                                            </div>
                                                        </form>
                                                    </td>
                                                </tr>
                                            )}
                                        </React.Fragment>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            )}

            {isDeleteModalOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-md">
                        <div className="p-6 border-b border-gray-200">
                            <h4 className="text-xl font-bold text-red-600 flex items-center">
                                <FaTrash className="mr-2" /> Confirm Deletion
                            </h4>
                        </div>
                        <div className="p-6">
                            <p className="text-gray-700 mb-6">
                                Are you sure you want to delete <strong className="font-semibold">{cameraName}</strong>?<br/>
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

            {isPublishModalOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-md">
                        <div className="p-6 border-b border-gray-200">
                            <h4 className={`text-xl font-bold flex items-center ${
                                publishedCameras.has(publishCameraId) ? 'text-gray-600' : 'text-yellow-600'
                            }`}>
                                <FaCameraRetro className="mr-2" /> Confirm {publishedCameras.has(publishCameraId) ? 'Unpublish' : 'Publish'}
                            </h4>
                        </div>
                        <div className="p-6">
                            <p className="text-gray-700 mb-6">
                                {publishedCameras.has(publishCameraId)
                                    ? 'Unpublish this camera from MediaMTX? It will no longer be available via HLS/WebRTC.'
                                    : 'Publish this camera to MediaMTX so it becomes available via HLS/WebRTC. Continue?'}
                            </p>
                            <div className="flex justify-end space-x-3">
                                <button
                                    onClick={() => { setIsPublishModalOpen(false); setPublishCameraId(null); }}
                                    className="px-4 py-2 text-sm font-medium rounded-lg border border-gray-300 text-gray-700 bg-white hover:bg-gray-50"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={confirmPublish}
                                    className={`px-4 py-2 text-sm font-medium rounded-lg text-white ${
                                        publishedCameras.has(publishCameraId)
                                            ? 'bg-gray-600 hover:bg-gray-700'
                                            : 'bg-yellow-600 hover:bg-yellow-700'
                                    }`}
                                >
                                    {publishedCameras.has(publishCameraId) ? 'Unpublish Camera' : 'Publish Camera'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {isDeleteLocModalOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-md">
                        <div className="p-6 border-b border-gray-200">
                            <h4 className="text-xl font-bold text-red-600 flex items-center">
                                <FaTrash className="mr-2" /> Confirm Deletion
                            </h4>
                        </div>
                        <div className="p-6">
                            <p className="text-gray-700 mb-4">
                                Are you sure you want to delete <strong className="font-semibold">{locationName}</strong>?
                            </p>
                            <p className="text-red-700 mb-6 font-medium text-sm">
                                ⚠️ WARNING: You must re-assign or remove all cameras using this location before deletion.
                            </p>
                            <div className="flex justify-end space-x-3">
                                <button
                                    onClick={() => {
                                        setIsDeleteLocModalOpen(false);
                                        setLocationToDeleteId(null);
                                    }}
                                    className="px-4 py-2 text-sm font-medium rounded-lg border border-gray-300 text-gray-700 bg-white hover:bg-gray-50"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={confirmDeleteLocation}
                                    className="px-4 py-2 text-sm font-medium rounded-lg text-white bg-red-600 hover:bg-red-700"
                                >
                                    Delete Location
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
