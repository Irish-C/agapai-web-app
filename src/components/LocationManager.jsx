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

    useEffect(() => {
        fetchLocations();
    }, []);

    const fetchLocations = async () => {
        try {
            const data = await fetchApi('/locations', 'GET');
            if (data.status === 'success') {
                setLocations(data.locations);
                // Notify parent component that locations have updated
                // This is so CameraManager can refresh its dropdown
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
                await fetchLocations(); // Await this to ensure parent is updated
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
        if (!editingLoc.loc_name.trim()) {
            setLocMessage({ text: 'Location name cannot be empty.', type: 'error' });
            return;
        }
        try {
            const data = await fetchApi(`/locations/${editingLoc.id}`, 'PATCH', { 
                loc_name: editingLoc.loc_name 
            });
            if (data.status === 'success') {
                setLocMessage({ text: 'Location updated successfully!', type: 'success' });
                setEditingLoc(null); // Exit edit mode
                await fetchLocations(); // Await this to ensure parent is updated
            } else {
                setLocMessage({ text: `Error: ${data.message}`, type: 'error' });
            }
        } catch (error) {
            setLocMessage({ text: `Error: ${error.message}`, type: 'error' });
        }
    };

    const handleDeleteLocation = async (locId) => {
        if (!window.confirm('Are you sure you want to delete this location? You must re-assign or remove cameras using this location first.')) {
            return;
        }
        setLocMessage({ text: '', type: '' });
        try {
            const data = await fetchApi(`/locations/${locId}`, 'DELETE');
            if (data.status === 'success') {
                setLocMessage({ text: 'Location removed successfully!', type: 'success' });
                await fetchLocations(); // Await this to ensure parent is updated
            } else {
                setLocMessage({ text: `Error: ${data.message}`, type: 'error' });
            }
        } catch (error) {
            setLocMessage({ text: `Error: ${error.message}`, type: 'error' });
        }
    };

    const messageClass = (msg) => msg.type === 'success'
        ? 'bg-green-100 border-green-400 text-green-700'
        : 'bg-red-100 border-red-400 text-red-700';

    return (
        <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-200 mt-12 max-w-4xl">
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
                        className="w-full border-gray-300 rounded-lg shadow-sm focus:ring-teal-500 focus:border-teal-500"
                        placeholder="e.g., Main Hall"
                        required
                    />
                </div>
                <button
                    type="submit"
                    className="flex items-center justify-center bg-green-600 text-white font-bold py-2 px-4 rounded-xl hover:bg-green-700 h-10 mt-6"
                >
                    <FaPlus className="mr-2" /> Add
                </button>
            </form>

            <h3 className="text-lg font-semibold text-gray-700 mb-2">Existing Locations</h3>
            <div className="space-y-2">
                {locations.length === 0 ? <p className="text-gray-500">No locations added yet.</p> : null}
                {locations.map(loc => (
                    <div key={loc.id} className="flex justify-between items-center p-3 border rounded-lg bg-gray-50">
                        
                        {editingLoc && editingLoc.id === loc.id ? (
                            // --- Edit Mode ---
                            <form onSubmit={handleUpdateLocation} className="flex-grow flex items-center gap-4">
                                <input
                                    type="text"
                                    value={editingLoc.name} // <-- FIX: Was editingLoc.loc_name
                                    onChange={(e) => setEditingLoc(prev => ({ ...prev, name: e.target.value }))} // <-- FIX: Was loc_name
                                    className="w-full border-gray-300 rounded-lg shadow-sm focus:ring-teal-500 focus:border-teal-500"
                                    required
                                />
                                <button
                                    type="submit"
                                    className="flex items-center bg-green-600 text-white text-sm font-bold py-1 px-3 rounded-lg hover:bg-green-700"
                                >
                                    <FaSave className="mr-1" /> Save
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setEditingLoc(null)}
                                    className="flex items-center bg-gray-500 text-white text-sm font-bold py-1 px-3 rounded-lg hover:bg-gray-600"
                                >
                                    <FaTimes className="mr-1" /> Cancel
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
                                        <FaPencilAlt className="mr-1" /> Edit
                                    </button>
                                    <button
                                        onClick={() => handleDeleteLocation(loc.id)}
                                        className="flex items-center bg-red-600 text-white text-sm font-bold py-1 px-3 rounded-lg hover:bg-red-700"
                                    >
                                        <FaTrash className="mr-1" /> Remove
                                    </button>
                                </div>
                            </>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
}