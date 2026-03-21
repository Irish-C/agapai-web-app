// src/features/manager/LocationManager.jsx - REDESIGNED with Simple Cards
import React, { useState, useEffect } from 'react';
import { FaMapMarkerAlt, FaTrash, FaPlus, FaPencilAlt, FaSave, FaTimes } from 'react-icons/fa';
import { fetchApi } from '../../services/apiService';

export default function LocationManager({ onLocationsUpdated }) {
    const [locations, setLocations] = useState([]);
    const [newLocName, setNewLocName] = useState('');
    const [editingLoc, setEditingLoc] = useState(null);
    const [locMessage, setLocMessage] = useState({ text: '', type: '' });
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [locationToDeleteId, setLocationToDeleteId] = useState(null);

    const sanitizeLocationName = (value) => {
        if (typeof value !== 'string') return '';
        return value
            .replace(/[<>`"']/g, '')
            .replace(/\s{2,}/g, ' ')
            .trimStart()
            .slice(0, 100);
    };

    useEffect(() => {
        fetchLocations();
    }, []);

    const fetchLocations = async () => {
        try {
            const data = await fetchApi('/locations', 'GET');
            if (data.status === 'success') {
                setLocations(data.locations);
                if(onLocationsUpdated) {
                    onLocationsUpdated(data.locations);
                }
            }
        } catch (err) {
            console.error("Error fetching locations:", err);
            setLocMessage({ text: `Failed to load locations: ${err.message}`, type: 'error' });
        }
    };

    const handleAddLocation = async (e) => {
        e.preventDefault();
        setLocMessage({ text: '', type: '' });
        const sanitizedName = sanitizeLocationName(newLocName).trim();
        if (!sanitizedName) {
            setLocMessage({ text: 'Location name cannot be empty.', type: 'error' });
            return;
        }
        try {
            const data = await fetchApi('/locations', 'POST', { loc_name: sanitizedName });
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
        const sanitizedName = sanitizeLocationName(editingLoc?.name).trim();
        if (!sanitizedName) {
            setLocMessage({ text: 'Location name cannot be empty.', type: 'error' });
            return;
        }
        try {
            const data = await fetchApi(`/locations/${editingLoc.id}`, 'PATCH', { 
                loc_name: sanitizedName 
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
        setIsDeleteModalOpen(true);
    };

    const confirmDelete = async () => {
        if (!locationToDeleteId) return;
        setIsDeleteModalOpen(false);
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

    const locationName = locations.find(loc => loc.id === locationToDeleteId)?.name || 'this location';

    return (
        <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-200">
            {/* Header */}
            <div className="flex items-center justify-between mb-6 pb-4 ">
                <h2 className="text-2xl font-bold text-gray-900 flex items-center">
                    <FaMapMarkerAlt className="mr-3 text-purple-600" /> Location Management
                </h2>
            </div>

            {locMessage.text && (
                <div className={`mb-6 p-4 border rounded-lg font-medium ${messageClass(locMessage)}`}>
                    {locMessage.text}
                </div>
            )}

            {/* Quick Add Form */}
            <form onSubmit={handleAddLocation} className="mb-6">
                <div className="flex gap-3">
                    <input
                        type="text"
                        value={newLocName}
                        onChange={(e) => setNewLocName(sanitizeLocationName(e.target.value))}
                        className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        placeholder="e.g., Main Lobby, Dining Hall..."
                        required
                    />
                    <button
                        type="submit"
                        className="px-6 py-3 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 flex items-center whitespace-nowrap"
                    >
                        <FaPlus className="mr-2" /> Add
                    </button>
                </div>
            </form>

            {/* Locations Grid */}
            {locations.length === 0 ? (
                <div className="py-12 text-center text-gray-500">
                    <FaMapMarkerAlt className="text-5xl mx-auto mb-3 opacity-30" />
                    <p className="text-lg">No locations yet. Add one above to get started.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-96 overflow-y-auto pr-2">
                    {locations.map((loc) => (
                        <div key={loc.id} className="border rounded-lg p-4 bg-gradient-to-br from-purple-50 to-transparenthoover:shadow-md transition-shadow">
                            {editingLoc && editingLoc.id === loc.id ? (
                                // Edit Mode
                                <form onSubmit={handleUpdateLocation} className="space-y-2">
                                    <input
                                        type="text"
                                        value={editingLoc.name}
                                        onChange={(e) => setEditingLoc(prev => ({ ...prev, name: sanitizeLocationName(e.target.value) }))}
                                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                        required
                                    />
                                    <div className="flex gap-2">
                                        <button
                                            type="submit"
                                            className="flex-1 bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 text-sm font-semibold flex items-center justify-center"
                                        >
                                            <FaSave className="mr-1" /> Save
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setEditingLoc(null)}
                                            className="flex-1 bg-gray-500 text-white py-2 rounded-lg hover:bg-gray-600 text-sm font-semibold"
                                        >
                                            Cancel
                                        </button>
                                    </div>
                                </form>
                            ) : (
                                // View Mode
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center flex-1">
                                        <FaMapMarkerAlt className="text-purple-600 mr-3 flex-shrink-0" />
                                        <strong className="text-gray-900 text-lg">{loc.name}</strong>
                                    </div>
                                    <div className="flex gap-2 flex-shrink-0">
                                        <button
                                            onClick={() => handleEditLocation(loc)}
                                            className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                                            title="Edit location"
                                        >
                                            <FaPencilAlt className="w-4 h-4" />
                                        </button>
                                        <button
                                            onClick={() => handleDeleteLocation(loc.id)}
                                            className="p-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                                            title="Delete location"
                                        >
                                            <FaTrash className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}

            {/* DELETE MODAL */}
            {isDeleteModalOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-md">
                        <div className="p-6 border-gray-200">
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
                                        setIsDeleteModalOpen(false);
                                        setLocationToDeleteId(null);
                                    }}
                                    className="px-4 py-2 text-sm font-medium rounded-lg border border-gray-300 text-gray-700 bg-white hover:bg-gray-50"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={confirmDelete}
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
