// src/components/LocationManager.jsx
import React, { useState, useEffect } from 'react';
import { fetchApi } from '../services/apiService'; 
import { 
    FaMapMarkerAlt, 
    FaTrash, 
    FaPlus,
    FaPencilAlt,
    FaSave,
    FaTimes
} from 'react-icons/fa';

// This component manages adding, editing, and deleting locations
export default function LocationManager({ onLocationsUpdated }) {
    const [locations, setLocations] = useState([]);
    const [newLocName, setNewLocName] = useState('');
    const [editingLoc, setEditingLoc] = useState(null);
    const [locMessage, setLocMessage] = useState({ text: '', type: '' });

    // --- NEW STATE FOR MODAL ---
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [locationToDeleteId, setLocationToDeleteId] = useState(null);
    // ---------------------------

    useEffect(() => {
        fetchLocations();
    }, []);

    const fetchLocations = async () => {
        try {
            const data = await fetchApi('/locations', 'GET');
            if (data.status === 'success') {
                setLocations(data.locations);
                // Notify parent component that locations have updated
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
        // Set the editing state with a *copy* of the location object
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
                setEditingLoc(null); // Exit edit mode
                await fetchLocations(); 
            } else {
                setLocMessage({ text: `Error: ${data.message}`, type: 'error' });
            }
        } catch (error) {
            setLocMessage({ text: `Error: ${error.message}`, type: 'error' });
        }
    };

    // --- UPDATED HANDLER TO OPEN MODAL ---
    const handleDeleteLocation = (locId) => {
        setLocationToDeleteId(locId);
        setIsDeleteModalOpen(true);
    };

    // --- NEW FUNCTION TO CONFIRM DELETION ---
    const confirmDelete = async () => {
        if (!locationToDeleteId) {
            return;
        }

        setIsDeleteModalOpen(false); // Close the modal
        setLocMessage({ text: '', type: '' }); // Clear message

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
    // ------------------------------------------

    const messageClass = (msg) => msg.type === 'success'
        ? 'bg-green-100 border-green-400 text-green-700'
        : 'bg-red-100 border-red-400 text-red-700';

    // Get the name for display in the modal
    const locationName = locations.find(loc => loc.id === locationToDeleteId)?.name || 'this location';

    return (
        <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-200 mt-2 max-w-4xl">
            <h2 className="text-2xl font-semibold text-gray-800 flex items-center mb-4 pb-2 border-b">
                <FaMapMarkerAlt className="mr-2 text-indigo-500" /> Location Management
            </h2>
            
            {locMessage.text && (
                <div className={`mb-6 p-4 border rounded-xl font-medium ${messageClass(locMessage)}`}>
                    {locMessage.text}
                </div>
            )}
            
            <h3 className="text-lg font-semibold text-gray-700 mb-2">Add New Location</h3>
            <form onSubmit={handleAddLocation} className="flex items-center gap-4 mb-6">
                <div className="flex-grow">
                    <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="newLocName">New Location Name</label>
                    <input
                        type="text"
                        id="newLocName"
                        name="newLocName"
                        value={newLocName}
                        onChange={(e) => setNewLocName(e.target.value)}
                        className="w-full border-gray-300 rounded-lg shadow-sm focus:ring-teal-500 focus:border-teal-500 pl-2 py-1"
                        placeholder="e.g., Main Hall"
                        required
                    />
                </div>
                <button
                    type="submit"
                    className="flex items-center justify-center bg-green-600 text-white font-bold py-2 px-9 rounded-xl hover:bg-green-700 h-10 mt-6"
                >
                    Add
                </button>
            </form>

            <h3 className="text-lg font-semibold text-gray-700 mb-2">Existing Locations</h3>
            
            {/* SCROLLABLE WRAPPER*/}
            <div className="space-y-2 max-h-73.5 overflow-y-auto pr-2"> 
                {locations.length === 0 ? <p className="text-gray-500">No locations added yet.</p> : null}
                {locations.map(loc => (
                    <div key={loc.id} className="flex justify-between items-center p-3 border rounded-lg bg-gray-50">
                        
                        {editingLoc && editingLoc.id === loc.id ? (
                            // --- Edit Mode (Buttons Swapped) ---
                            <form onSubmit={handleUpdateLocation} className="flex-grow flex items-center gap-4">
                                <input
                                    type="text"
                                    value={editingLoc.name} 
                                    onChange={(e) => setEditingLoc(prev => ({ ...prev, name: e.target.value }))} 
                                    className="w-full border-gray-300 rounded-lg shadow-sm focus:ring-teal-500 focus:border-teal-500 pl-2 py-1"
                                    required
                                />
                                {/* Swapped buttons order */}
                                <button
                                    type="button"
                                    onClick={() => setEditingLoc(null)}
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
                            </form>
                        ) : (
                            // --- View Mode ---
                            <>
                                <strong className="text-gray-900">{loc.name}</strong>
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => handleEditLocation(loc)}
                                        className="flex items-center bg-blue-600 text-white text-sm font-bold py-1 px-3 rounded-lg hover:bg-blue-700"
                                    >
                                        Edit
                                    </button>
                                    <button
                                        onClick={() => handleDeleteLocation(loc.id)}
                                        className="flex items-center bg-red-600 text-white text-sm font-bold py-1 px-3 rounded-lg hover:bg-red-700"
                                    >
                                        Remove
                                    </button>
                                </div>
                            </>
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
                                <FaTrash className="mr-2" /> Confirm Deletion
                            </h4>
                        </div>
                        <div className="p-6">
                            <p className="text-gray-700 mb-4">
                                Are you sure you want to delete <strong className="font-semibold">{locationName}</strong>?
                            </p>
                            <p className="text-red-700 mb-6 font-medium">
                                WARNING: You must re-assign or remove all cameras using this location before deletion.
                                This action cannot be undone.
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
            {/* --------------------------------------------------------------------------------- */}
        </div>
    );
}