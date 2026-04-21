import { useState, useEffect } from 'react';
import { onCameraUpdated, offCameraUpdated } from '../services/socket';
import { fetchApi } from '../services/apiService';

export function useCameraManager(onCameraUpdated) {
  const [cameras, setCameras] = useState([]);
  const [message, setMessage] = useState({ text: '', type: '' });
  const [editingCam, setEditingCam] = useState(null);
  const [newCam, setNewCam] = useState({ name: '', url: '', locId: '' });

  const sanitizeCameraName = (value) => {
    if (typeof value !== 'string') return '';
    return value
      .replace(/[<>`"']/g, '')
      .replace(/\s{2,}/g, ' ')
      .trim()
      .slice(0, 100);
  };

  const sanitizeStreamUrl = (value) => {
    if (typeof value !== 'string') return '';
    return value.replace(/[\s\u0000-\u001F\u007F]/g, '').slice(0, 500);
  };

  const sanitizeLocationId = (value) => {
    if (value === null || value === undefined) return '';
    return String(value).replace(/[^0-9]/g, '');
  };

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

  // Real-time update: listen for camera_updated events
  useEffect(() => {
    function handleCameraUpdated(data) {
      // data is the updated camera config (single camera)
      setCameras([data]);
    }
    onCameraUpdated(handleCameraUpdated);
    return () => offCameraUpdated(handleCameraUpdated);
  }, []);

  const addCamera = async (cameraData) => {
    setMessage({ text: '', type: '' });
    const sanitizedPayload = {
      cam_name: sanitizeCameraName(cameraData?.cam_name),
      stream_url: sanitizeStreamUrl(cameraData?.stream_url || ''),
      loc_id: parseInt(sanitizeLocationId(cameraData?.loc_id), 10),
    };

    if (!sanitizedPayload.cam_name) {
      setMessage({ text: 'Camera name cannot be empty.', type: 'error' });
      return false;
    }

    if (!Number.isInteger(sanitizedPayload.loc_id)) {
      setMessage({ text: 'A valid location is required.', type: 'error' });
      return false;
    }

    try {
      const data = await fetchApi('/cameras', 'POST', sanitizedPayload);
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
    const sanitizedPayload = {
      cam_name: sanitizeCameraName(cameraData?.cam_name),
      stream_url: sanitizeStreamUrl(cameraData?.stream_url || ''),
      loc_id: parseInt(sanitizeLocationId(cameraData?.loc_id), 10),
    };

    if (!sanitizedPayload.cam_name) {
      setMessage({ text: 'Camera name cannot be empty.', type: 'error' });
      return false;
    }

    if (!Number.isInteger(sanitizedPayload.loc_id)) {
      setMessage({ text: 'A valid location is required.', type: 'error' });
      return false;
    }

    try {
      const data = await fetchApi(`/cameras/${id}`, 'PATCH', sanitizedPayload);
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
