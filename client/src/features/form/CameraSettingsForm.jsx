import React, { useState, useEffect } from 'react';
import { FaCamera, FaCheckCircle, FaTimesCircle, FaSave, FaSync } from 'react-icons/fa';
import { fetchApi } from '../../services/apiService';

export default function CameraSettingsForm({ readOnly = false, onNavigateToLocations }) {
  const [camera, setCamera] = useState(null);
  const [locations, setLocations] = useState([]);
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    stream_url: '',
    loc_id: '',
  });
  const [message, setMessage] = useState({ text: '', type: '' });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [saving, setSaving] = useState(false);  // Add loading state for save action

  // Fetch camera config and locations on mount
  useEffect(() => {
    fetchCameraAndLocations();
  }, []);

  const fetchCameraAndLocations = async () => {
    try {
      setLoading(true);
      // Fetch single camera config
      const cameraData = await fetchApi('/settings/camera', 'GET');
      if (cameraData) {
        setCamera(cameraData);
        setFormData({
          name: cameraData.name || '',
          stream_url: cameraData.stream_url || '',
          loc_id: cameraData.location_id ? String(cameraData.location_id) : '',
        });
      }

      // Fetch locations
      const locationsData = await fetchApi('/locations', 'GET');
      if (locationsData.status === 'success') {
        setLocations(locationsData.locations || []);
      }
    } catch (err) {
      setMessage({ text: `Failed to load settings: ${err.message}`, type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSave = async () => {
    try {
      setMessage({ text: '', type: '' });
      setSaving(true);

      if (!formData.name.trim()) {
        setMessage({ text: 'Camera name is required', type: 'error' });
        setSaving(false);
        return;
      }

      if (!formData.stream_url.trim()) {
        setMessage({ text: 'Stream URL is required', type: 'error' });
        setSaving(false);
        return;
      }

      const payload = {
        cam_name: formData.name.trim(),
        stream_url: formData.stream_url.trim(),
        loc_id: formData.loc_id ? parseInt(formData.loc_id, 10) : null,
      };

      const result = await fetchApi('/settings/camera', 'PUT', payload);

      // Check if result contains camera config (successful response) or error
      if (result && result.id) {
        // Build success message that includes AI service status
        const aiStatus = result.ai_service_status === 'success' ? '✓' : '⚠';
        const aiMessage = result.ai_service_message || 'Stream restarted';
        const messageText = `Camera settings updated successfully! ${aiStatus} Stream: ${aiMessage}`;
        
        setMessage({ text: messageText, type: 'success' });
        setEditing(false);
        await fetchCameraAndLocations();
      } else if (result && result.message) {
        setMessage({ text: result.message, type: 'error' });
      } else {
        setMessage({ text: 'Failed to update camera settings', type: 'error' });
      }
    } catch (err) {
      setMessage({ text: `Error: ${err.message}`, type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setEditing(false);
    if (camera) {
      setFormData({
        name: camera.name || '',
        stream_url: camera.stream_url || '',
        loc_id: camera.location_id ? String(camera.location_id) : '',
      });
    }
  };

  const handleRefresh = async () => {
    try {
      setRefreshing(true);
      setMessage({ text: '', type: '' });
      await fetchCameraAndLocations();
      setMessage({ text: 'Camera settings refreshed!', type: 'success' });
    } catch (err) {
      setMessage({ text: `Failed to refresh: ${err.message}`, type: 'error' });
    } finally {
      setRefreshing(false);
    }
  };

  if (loading) {
    return <div className="text-center py-8">Loading camera settings...</div>;
  }

  return (
    <div className="max-w-2xl">
      {/* Message Display */}
      {message.text && (
        <div
          className={`p-4 rounded-lg mb-4 flex items-center ${
            message.type === 'success'
              ? 'bg-green-50 text-green-800 border border-green-200'
              : 'bg-red-50 text-red-800 border border-red-200'
          }`}
        >
          {message.type === 'success' ? (
            <FaCheckCircle className="mr-2 flex-shrink-0" />
          ) : (
            <FaTimesCircle className="mr-2 flex-shrink-0" />
          )}
          {message.text}
        </div>
      )}

      {/* Camera Configuration Card */}
      <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center">
            <FaCamera className="text-teal-600 text-2xl mr-3" />
            <div>
              <h3 className="text-lg font-bold text-gray-900">Camera Configuration</h3>
              <p className="text-sm text-gray-600">Single camera mode - Configure your main camera</p>
            </div>
          </div>
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className={`p-2 rounded-lg transition flex items-center gap-2 ${
              refreshing
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
            title="Refresh camera settings"
          >
            <FaSync className={`w-5 h-5 ${refreshing ? 'animate-spin' : ''}`} />
          </button>
        </div>

        {/* Status Indicator */}
        {camera && (
          <div className="mb-6 p-3 bg-blue-50 border border-blue-200 rounded-lg flex items-center">
            <FaCheckCircle className="text-blue-600 mr-2" />
            <div>
              <p className="text-sm font-medium text-blue-900">Camera Status</p>
              <p className="text-xs text-blue-700">
                {camera.status === 'active' ? ' Active' : '⚠ Inactive'}
              </p>
            </div>
          </div>
        )}

        {/* Camera Settings Form */}
        <div className="space-y-4">
          {/* Camera Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Camera Name
            </label>
            {editing && !readOnly ? (
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                placeholder="e.g., Main Camera, Front Door"
              />
            ) : (
              <p className="px-3 py-2 bg-gray-50 rounded-lg text-gray-800 font-medium">
                {formData.name || 'Not configured'}
              </p>
            )}
          </div>

          {/* Stream URL */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Stream URL
            </label>
            {editing && !readOnly ? (
              <input
                type="text"
                name="stream_url"
                value={formData.stream_url}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 font-mono text-sm"
                placeholder="e.g., rtsp://localhost:8554/stream"
              />
            ) : (
              <p className="px-3 py-2 bg-gray-50 rounded-lg text-gray-800 font-mono text-sm break-all">
                {formData.stream_url || 'Not configured'}
              </p>
            )}
          </div>

          {/* Location Selector */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Location
            </label>
            {editing && !readOnly ? (
              <select
                name="loc_id"
                value={formData.loc_id}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
              >
                <option value="">-- Select Location --</option>
                {locations.map(loc => (
                  <option key={loc.id} value={String(loc.id)}>
                    {loc.name}
                  </option>
                ))}
              </select>
            ) : (
              <p className="px-3 py-2 bg-gray-50 rounded-lg text-gray-800">
                {camera?.location_name || 'No location assigned'}
              </p>
            )}
          </div>

          {/* Manage Locations Link */}
          <div className="pt-2">
            <p className="text-sm text-gray-600">
              Need to add or manage locations?{' '}
              {onNavigateToLocations ? (
                <button 
                  onClick={onNavigateToLocations}
                  className="text-teal-600 hover:underline font-medium bg-none border-none cursor-pointer"
                >
                  Go to Location Management
                </button>
              ) : (
                <span className="text-teal-600 font-medium">Location Management available in Settings</span>
              )}
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        {!readOnly && (
          <div className="mt-6 flex gap-3">
            {!editing ? (
              <button
                onClick={() => setEditing(true)}
                className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition flex items-center gap-2 font-medium"
              >
                <FaSave className="w-4 h-4" />
                Edit Settings
              </button>
            ) : (
              <>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className={`px-4 py-2 rounded-lg transition flex items-center gap-2 font-medium ${
                    saving
                      ? 'bg-gray-400 text-white cursor-not-allowed'
                      : 'bg-green-600 text-white hover:bg-green-700'
                  }`}
                >
                  {saving ? (
                    <>
                      <div className="inline-block animate-spin">⟳</div>
                      Saving & Restarting Stream...
                    </>
                  ) : (
                    <>
                      <FaCheckCircle className="w-4 h-4" />
                      Save Changes
                    </>
                  )}
                </button>
                <button
                  onClick={handleCancel}
                  disabled={saving}
                  className={`px-4 py-2 rounded-lg transition font-medium ${
                    saving
                      ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                      : 'bg-gray-300 text-gray-800 hover:bg-gray-400'
                  }`}
                >
                  Cancel
                </button>
              </>
            )}
          </div>
        )}

        {readOnly && (
          <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg text-yellow-800 text-sm">
            You have read-only access to camera settings. Contact an administrator to make changes.
          </div>
        )}
      </div>
    </div>
  );
}
