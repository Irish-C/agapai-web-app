import { useState } from 'react';
import { fetchApi } from '../services/apiService';

export function useCameraManager(onCameraUpdated) {
  const [cameras, setCameras] = useState([]);
  const [message, setMessage] = useState({ text: '', type: '' });
  const [editingCam, setEditingCam] = useState(null);
  const [newCam, setNewCam] = useState({ name: '', url: '', locId: '' });

  const fetchCameras = async () => {
    try {
      const data = await fetchApi('/cameras', 'GET');
      if (data.status === 'success') {
        setCameras(data.cameras);
        onCameraUpdated?.();
      }
    } catch (err) {
      setMessage({ text: `Failed to load cameras: ${err.message}`, type: 'error' });
    }
  };

  const addCamera = async (cameraData) => {
    setMessage({ text: '', type: '' });
    try {
      const data = await fetchApi('/cameras', 'POST', cameraData);
      if (data.status === 'success') {
        setMessage({ text: 'Camera added successfully!', type: 'success' });
        setNewCam({ name: '', url: '', locId: '' });
        await fetchCameras();
        return true;
      } else {
        setMessage({ text: `Error: ${data.message}`, type: 'error' });
      }
    } catch (error) {
      setMessage({ text: `Error: ${error.message}`, type: 'error' });
    }
    return false;
  };

  const updateCamera = async (id, cameraData) => {
    setMessage({ text: '', type: '' });
    try {
      const data = await fetchApi(`/cameras/${id}`, 'PATCH', cameraData);
      if (data.status === 'success') {
        setMessage({ text: 'Camera updated successfully!', type: 'success' });
        setEditingCam(null);
        await fetchCameras();
        return true;
      } else {
        setMessage({ text: `Error: ${data.message}`, type: 'error' });
      }
    } catch (error) {
      setMessage({ text: `Error: ${error.message}`, type: 'error' });
    }
    return false;
  };

  const deleteCamera = async (id) => {
    setMessage({ text: '', type: '' });
    try {
      const data = await fetchApi(`/cameras/${id}`, 'DELETE');
      if (data.status === 'success') {
        // Clear local storage for deleted camera
        localStorage.removeItem(`camera_${id}`);
        localStorage.removeItem(`camera_${id}_settings`);
        
        setMessage({ text: 'Camera removed successfully!', type: 'success' });
        await fetchCameras();
        return true;
      } else {
        setMessage({ text: `Error: ${data.message}`, type: 'error' });
      }
    } catch (error) {
      setMessage({ text: `Error: ${error.message}`, type: 'error' });
    }
    return false;
  };

  return { cameras, setCameras, message, setMessage, editingCam, setEditingCam, newCam, setNewCam, fetchCameras, addCamera, updateCamera, deleteCamera };
}
