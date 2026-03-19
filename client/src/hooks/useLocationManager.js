import { useState } from 'react';
import { fetchApi } from '../services/apiService';

export function useLocationManager() {
  const [locations, setLocations] = useState([]);
  const [message, setMessage] = useState({ text: '', type: '' });
  const [editingLoc, setEditingLoc] = useState(null);
  const [newLocName, setNewLocName] = useState('');

  const fetchLocations = async () => {
    try {
      const data = await fetchApi('/locations', 'GET');
      if (data.status === 'success') setLocations(data.locations);
    } catch (err) {
      setMessage({ text: `Failed to load locations: ${err.message}`, type: 'error' });
    }
  };

  const addLocation = async (name) => {
    setMessage({ text: '', type: '' });
    if (!name.trim()) {
      setMessage({ text: 'Location name cannot be empty.', type: 'error' });
      return false;
    }
    try {
      const data = await fetchApi('/locations', 'POST', { loc_name: name });
      if (data.status === 'success') {
        setMessage({ text: 'Location added successfully!', type: 'success' });
        setNewLocName('');
        await fetchLocations();
        return true;
      } else {
        setMessage({ text: `Error: ${data.message}`, type: 'error' });
      }
    } catch (error) {
      setMessage({ text: `Error: ${error.message}`, type: 'error' });
    }
    return false;
  };

  const updateLocation = async (id, name) => {
    setMessage({ text: '', type: '' });
    if (!name.trim()) {
      setMessage({ text: 'Location name cannot be empty.', type: 'error' });
      return false;
    }
    try {
      const data = await fetchApi(`/locations/${id}`, 'PATCH', { loc_name: name });
      if (data.status === 'success') {
        setMessage({ text: 'Location updated successfully!', type: 'success' });
        setEditingLoc(null);
        await fetchLocations();
        return true;
      } else {
        setMessage({ text: `Error: ${data.message}`, type: 'error' });
      }
    } catch (error) {
      setMessage({ text: `Error: ${error.message}`, type: 'error' });
    }
    return false;
  };

  const deleteLocation = async (id) => {
    setMessage({ text: '', type: '' });
    try {
      const data = await fetchApi(`/locations/${id}`, 'DELETE');
      if (data.status === 'success') {
        setMessage({ text: 'Location removed successfully!', type: 'success' });
        await fetchLocations();
        return true;
      } else {
        setMessage({ text: `Error: ${data.message}`, type: 'error' });
      }
    } catch (error) {
      setMessage({ text: `Error: ${error.message}`, type: 'error' });
    }
    return false;
  };

  return { locations, setLocations, message, setMessage, editingLoc, setEditingLoc, newLocName, setNewLocName, fetchLocations, addLocation, updateLocation, deleteLocation };
}
