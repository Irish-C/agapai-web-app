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
                fetchLocations();
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
                setEditingLoc(null);
                fetchLocations();
            } else {
                setLocMessage({ text: `Error: ${data.message}`, type: 'error' });
            }
        } catch (error) {
            setLocMessage({ text: `Error: ${error.message}`, type: 'error' });
        }
    };
    const handleDeleteLocation = async (locId) => {
        setLocMessage({ text: '', type: '' });
        if (!window.confirm("Are you sure you want to delete this location?")) {
            return;
        }
        try {
            const data = await fetchApi(`/locations/${locId}`, 'DELETE');
            if (data.status === 'success') {
                setLocMessage({ text: 'Location deleted successfully!', type: 'success' });
                fetchLocations();
            } else {
                setLocMessage({ text: `Error: ${data.message}`, type: 'error' });
            }
        } catch (error) {
            setLocMessage({ text: `Error: ${error.message}`, type: 'error' });
        }
    }
    return (
        <div className="p-4 border rounded-lg shadow-md bg-white">
            <h3 className="text-xl font-semibold mb-4 flex items-center">
                <FaMapMarkerAlt className="mr-2 text-teal-600" /> Location Manager
            </h3>
            {locMessage.text && (
                <div className={`mb-4 p-3 rounded-lg text-sm ${
                    locMessage.type === 'success'
                        ? 'bg-green-100 text-green-700 border border-green-400'
                        : 'bg-red-100 text-red-700 border border-red-400'
                }`}>
                    {locMessage.text}
                </div>
            )}
            <form onSubmit={editingLoc ? handleUpdateLocation : handleAddLocation} className="mb-6 flex space-x-2">
                <input
                    type="text"
                    className="flex-grow border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-teal-500"
                    placeholder="Enter location name"
                    value={editingLoc ? editingLoc.loc_name : newLocName}
                    onChange={(e) => editingLoc ? setEditingLoc({ ...editingLoc, loc_name: e.target.value }) : setNewLocName(e.target.value)}
                />
                <button
                    type="submit"
                    className="bg-teal-600 text-white px-4 py-2 rounded-lg hover:bg-teal-700 transition duration-150 flex items-center"
                >
                    {editingLoc ? <FaSave className="mr-2" /> : <FaPlus className="mr-2" />}
                    {editingLoc ? 'Save' : 'Add'}
                </button>
                {editingLoc && (
                    <button
                        type="button"
                        onClick={() => setEditingLoc(null)}
                        className="bg-gray-400 text-white px-4 py-2 rounded-lg hover:bg-gray-500 transition duration-150 flex items-center"
                    >
                        <FaTimes className="mr-2" /> Cancel
                    </button>
                )}
            </form>
            <ul>
                {locations.map((loc) => (
                    <li key={loc.id} className="flex justify-between items-center mb-3">
                        <span>{loc.loc_name}</span>
                        <div className="space-x-2">
                            <button
                                onClick={() => handleEditLocation(loc)}
                                className="text-blue-600 hover:text-blue-800"
                            >
                                <FaPencilAlt />
                            </button>
                            <button
                                onClick={() => handleDeleteLocation(loc.id)}    
                                className="text-red-600 hover:text-red-800"
                            >
                                <FaTrash />
                            </button>
                        </div>
                    </li>
                ))}
            </ul>
        </div>
    );
}