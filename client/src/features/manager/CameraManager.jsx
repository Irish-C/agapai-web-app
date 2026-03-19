import React, { useState, useEffect } from 'react';
import { fetchApi } from '../../services/apiService';
import { FaTrash, FaPlus, FaSave, FaCameraRetro, FaMapMarkerAlt } from 'react-icons/fa';
import { useLocalStorageSet } from '../../hooks/useLocalStorageSet';
import Modal from '../../components/Modal';
import { TableInput, FormActions, EmptyState, ActionButtons } from '../../components/FormComponents';
import { messageClass, tabButtonClass } from '../../utils/uiConstants';

export default function CameraManager({ locations: initialLocations, onCameraUpdated }) {
  const [cameras, setCameras] = useState([]);
  const [newCam, setNewCam] = useState({ name: '', url: '', locId: '' });
  const [camMessage, setCamMessage] = useState({ text: '', type: '' });
  const [activeTab, setActiveTab] = useState('list');
  const [editingCam, setEditingCam] = useState(null);
  const [locations, setLocations] = useState(initialLocations || []);
  const [newLocName, setNewLocName] = useState('');
  const [editingLoc, setEditingLoc] = useState(null);
  const [locMessage, setLocMessage] = useState({ text: '', type: '' });
  
  const [publishedCameras, setPublishedCameras] = useLocalStorageSet('publishedCameras');
  const [deleteModal, setDeleteModal] = useState({ open: false, type: '', id: null });
  const [publishModal, setPublishModal] = useState({ open: false, id: null });

  useEffect(() => { fetchCameras(); fetchLocations(); }, []);
  useEffect(() => {
    if (locations.length > 0 && !newCam.locId) setNewCam(prev => ({ ...prev, locId: locations[0].id }));
    if (editingCam && !editingCam.loc_id && locations.length > 0) setEditingCam(prev => ({ ...prev, loc_id: locations[0].id }));
  }, [locations]);

  const show = (msg, type) => msg?.type === 'camera' ? setCamMessage({ text: msg.text, type }) : setLocMessage({ text: msg.text, type });
  const clear = (msg) => msg?.type === 'camera' ? setCamMessage({ text: '', type: '' }) : setLocMessage({ text: '', type: '' });
  
  const fetchCameras = async () => {
    try {
      const data = await fetchApi('/cameras', 'GET');
      if (data.status === 'success') { setCameras(data.cameras); onCameraUpdated?.(); }
    } catch (err) { show({ text: `Failed to load cameras: ${err.message}`, type: 'camera' }, 'error'); }
  };

  const fetchLocations = async () => {
    try {
      const data = await fetchApi('/locations', 'GET');
      if (data.status === 'success') setLocations(data.locations);
    } catch (err) { show({ text: `Failed to load locations: ${err.message}`, type: 'location' }, 'error'); }
  };

  const handleChange = (e, setFn) => {
    const { name, value } = e.target;
    setFn(prev => ({ ...prev, [name]: value }));
  };

  const handleAddCamera = async (e) => {
    e.preventDefault();
    setCamMessage({ text: '', type: '' });
    try {
      const data = await fetchApi('/cameras', 'POST', {
        cam_name: newCam.name,
        stream_url: newCam.url,
        loc_id: parseInt(newCam.locId),
      });
      if (data.status === 'success') {
        show({ text: 'Camera added successfully!', type: 'camera' }, 'success');
        setNewCam({ name: '', url: '', locId: locations[0]?.id || '' });
        setActiveTab('list');
        await fetchCameras();
      } else {
        show({ text: `Error: ${data.message}`, type: 'camera' }, 'error');
      }
    } catch (error) { show({ text: `Error: ${error.message}`, type: 'camera' }, 'error'); }
  };

  const handleUpdateCamera = async (e) => {
    e.preventDefault();
    setCamMessage({ text: '', type: '' });
    if (!editingCam.cam_name.trim()) { show({ text: 'Camera name cannot be empty.', type: 'camera' }, 'error'); return; }
    try {
      const data = await fetchApi(`/cameras/${editingCam.id}`, 'PATCH', {
        cam_name: editingCam.cam_name,
        stream_url: editingCam.stream_url,
        loc_id: parseInt(editingCam.loc_id) || locations[0]?.id,
      });
      if (data.status === 'success') {
        show({ text: 'Camera updated successfully!', type: 'camera' }, 'success');
        setEditingCam(null);
        await fetchCameras();
      } else {
        show({ text: `Error: ${data.message}`, type: 'camera' }, 'error');
      }
    } catch (error) { show({ text: `Error: ${error.message}`, type: 'camera' }, 'error'); }
  };

  const handleDeleteCamera = async () => {
    setCamMessage({ text: '', type: '' });
    try {
      const data = await fetchApi(`/cameras/${deleteModal.id}`, 'DELETE');
      if (data.status === 'success') {
        show({ text: 'Camera removed successfully!', type: 'camera' }, 'success');
        await fetchCameras();
      } else {
        show({ text: `Error: ${data.message}`, type: 'camera' }, 'error');
      }
    } catch (error) { show({ text: `Error: ${error.message}`, type: 'camera' }, 'error'); }
    setDeleteModal({ open: false, type: '', id: null });
  };

  const handlePublishCamera = async () => {
    setCamMessage({ text: '', type: '' });
    const isPublished = publishedCameras.has(publishModal.id);
    const endpoint = isPublished ? 'unpublish' : 'publish';
    try {
      const data = await fetchApi(`/cameras/${publishModal.id}/${endpoint}`, 'POST');
      if (data && (data.status === 'ok' || data.status === 'success')) {
        setPublishedCameras(prev => {
          const updated = new Set(prev);
          isPublished ? updated.delete(publishModal.id) : updated.add(publishModal.id);
          return updated;
        });
        show({ text: `${isPublished ? 'Unpublished' : 'Published'} successfully!`, type: 'camera' }, 'success');
      }
    } catch (err) { show({ text: `Failed: ${err?.message || err}`, type: 'camera' }, 'error'); }
    setPublishModal({ open: false, id: null });
  };

  const handleAddLocation = async (e) => {
    e.preventDefault();
    setLocMessage({ text: '', type: '' });
    if (!newLocName.trim()) { show({ text: 'Location name cannot be empty.', type: 'location' }, 'error'); return; }
    try {
      const data = await fetchApi('/locations', 'POST', { loc_name: newLocName });
      if (data.status === 'success') {
        show({ text: 'Location added successfully!', type: 'location' }, 'success');
        setNewLocName('');
        await fetchLocations();
      } else {
        show({ text: `Error: ${data.message}`, type: 'location' }, 'error');
      }
    } catch (error) { show({ text: `Error: ${error.message}`, type: 'location' }, 'error'); }
  };

  const handleUpdateLocation = async (e) => {
    e.preventDefault();
    setLocMessage({ text: '', type: '' });
    if (!editingLoc.name.trim()) { show({ text: 'Location name cannot be empty.', type: 'location' }, 'error'); return; }
    try {
      const data = await fetchApi(`/locations/${editingLoc.id}`, 'PATCH', { loc_name: editingLoc.name });
      if (data.status === 'success') {
        show({ text: 'Location updated successfully!', type: 'location' }, 'success');
        setEditingLoc(null);
        await fetchLocations();
      } else {
        show({ text: `Error: ${data.message}`, type: 'location' }, 'error');
      }
    } catch (error) { show({ text: `Error: ${error.message}`, type: 'location' }, 'error'); }
  };

  const handleDeleteLocation = async () => {
    setLocMessage({ text: '', type: '' });
    try {
      const data = await fetchApi(`/locations/${deleteModal.id}`, 'DELETE');
      if (data.status === 'success') {
        show({ text: 'Location removed successfully!', type: 'location' }, 'success');
        await fetchLocations();
      } else {
        show({ text: `Error: ${data.message}`, type: 'location' }, 'error');
      }
    } catch (error) { show({ text: `Error: ${error.message}`, type: 'location' }, 'error'); }
    setDeleteModal({ open: false, type: '', id: null });
  };

  const CameraTable = () => (
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
        {cameras.map((cam, idx) => (
          <React.Fragment key={cam.id}>
            <tr className={`transition-colors ${idx % 2 === 0 ? 'bg-white' : 'bg-gray-100'} hover:bg-gray-200`}>
              <td className="px-4 py-3 text-gray-900 font-semibold w-1/4 overflow-hidden">{cam.name}</td>
              <td className="px-4 py-3 text-gray-700 w-1/4 overflow-hidden">{cam.location_name || 'Unknown'}</td>
              <td className="px-4 py-3 text-gray-600 text-sm w-3/10 overflow-hidden">
                <span className="truncate block">{cam.stream_url}</span>
              </td>
              <td className="px-4 py-3 w-1/5">
                {editingCam?.id === cam.id ? (
                  <ActionButtons buttons={[
                    { label: 'Save', onClick: handleUpdateCamera, className: 'bg-green-600 text-white text-xs py-1 px-2 rounded hover:bg-green-700 font-semibold' },
                    { label: 'Cancel', onClick: () => setEditingCam(null), className: 'bg-gray-500 text-white text-xs py-1 px-2 rounded hover:bg-gray-600 font-semibold' },
                  ]} />
                ) : (
                  <ActionButtons buttons={[
                    { label: 'Edit', onClick: () => setEditingCam({ ...cam, cam_name: cam.name, stream_url: cam.stream_url || '', loc_id: cam.location_id || locations[0]?.id }), className: 'bg-blue-600 text-white text-xs py-1 px-2 rounded hover:bg-blue-700 font-semibold disabled:opacity-50', disabled: locations.length === 0 },
                    { label: 'Delete', onClick: () => setDeleteModal({ open: true, type: 'camera', id: cam.id }), className: 'bg-red-600 text-white text-xs py-1 px-2 rounded hover:bg-red-700 font-semibold' },
                    { label: publishedCameras.has(cam.id) ? 'Unpublish' : 'Publish', onClick: () => setPublishModal({ open: true, id: cam.id }), className: publishedCameras.has(cam.id) ? 'bg-gray-600 text-white text-xs py-1 px-2 rounded hover:bg-gray-700 font-semibold' : 'bg-yellow-600 text-white text-xs py-1 px-2 rounded hover:bg-yellow-700 font-semibold' },
                  ]} />
                )}
              </td>
            </tr>
            {editingCam?.id === cam.id && (
              <tr className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-100'}>
                <td colSpan="4" className="px-4 py-3">
                  <form onSubmit={handleUpdateCamera} className="space-y-3 bg-blue-50 p-4 rounded-lg border border-blue-200">
                    <div className="grid grid-cols-3 gap-4">
                      <TableInput label="Camera Name" name="cam_name" value={editingCam.cam_name} onChange={(e) => handleChange(e, setEditingCam)} placeholder="Camera name" />
                      <TableInput label="Stream URL" name="stream_url" value={editingCam.stream_url} onChange={(e) => handleChange(e, setEditingCam)} placeholder="Stream URL" type="url" />
                      <TableInput label="Location" name="loc_id" value={editingCam.loc_id} onChange={(e) => handleChange(e, setEditingCam)} options={locations} />
                    </div>
                    <FormActions onSubmit={() => {}} onCancel={() => setEditingCam(null)} submitLabel="Save" submitIcon={FaSave} />
                  </form>
                </td>
              </tr>
            )}
          </React.Fragment>
        ))}
      </tbody>
    </table>
  );

  const LocationTable = () => (
    <table className="w-full border-collapse" style={{ tableLayout: 'fixed' }}>
      <thead>
        <tr className="bg-gray-200 sticky top-0">
          <th className="px-4 py-3 text-left font-semibold text-gray-900 w-4/5">Location Name</th>
          <th className="px-4 py-3 text-center font-semibold text-gray-900 w-1/5">Actions</th>
        </tr>
      </thead>
      <tbody>
        {locations.map((loc, idx) => (
          <React.Fragment key={loc.id}>
            <tr className={`transition-colors ${idx % 2 === 0 ? 'bg-white' : 'bg-gray-100'} hover:bg-gray-200`}>
              <td className="px-4 py-3 text-gray-900 font-semibold w-4/5 overflow-hidden">{loc.name}</td>
              <td className="px-4 py-3 w-1/5">
                {editingLoc?.id === loc.id ? (
                  <ActionButtons buttons={[
                    { label: 'Save', onClick: handleUpdateLocation, className: 'bg-green-600 text-white text-xs py-1 px-2 rounded hover:bg-green-700 font-semibold' },
                    { label: 'Cancel', onClick: () => setEditingLoc(null), className: 'bg-gray-500 text-white text-xs py-1 px-2 rounded hover:bg-gray-600 font-semibold' },
                  ]} />
                ) : (
                  <ActionButtons buttons={[
                    { label: 'Edit', onClick: () => setEditingLoc({ ...loc }), className: 'bg-blue-600 text-white text-xs py-1 px-2 rounded hover:bg-blue-700 font-semibold' },
                    { label: 'Delete', onClick: () => setDeleteModal({ open: true, type: 'location', id: loc.id }), className: 'bg-red-600 text-white text-xs py-1 px-2 rounded hover:bg-red-700 font-semibold' },
                  ]} />
                )}
              </td>
            </tr>
            {editingLoc?.id === loc.id && (
              <tr className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-100'}>
                <td colSpan="2" className="px-4 py-3">
                  <form onSubmit={handleUpdateLocation} className="space-y-3 bg-blue-50 p-4 rounded-lg border border-blue-200">
                    <TableInput label="Location Name" name="name" value={editingLoc.name} onChange={(e) => handleChange(e, setEditingLoc)} placeholder="Location name" />
                    <FormActions onSubmit={() => {}} onCancel={() => setEditingLoc(null)} submitLabel="Save" />
                  </form>
                </td>
              </tr>
            )}
          </React.Fragment>
        ))}
      </tbody>
    </table>
  );

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

      <div className="flex gap-2 mb-12">
        <button onClick={() => setActiveTab('list')} className={tabButtonClass(activeTab === 'list')}>
          Camera List ({cameras.length})
        </button>
        <button onClick={() => setActiveTab('add')} className={tabButtonClass(activeTab === 'add')}>
          Add Camera
        </button>
        <button onClick={() => setActiveTab('locations')} className={tabButtonClass(activeTab === 'locations')}>
          Locations ({locations.length})
        </button>
      </div>

      {activeTab === 'list' && (
        <div>
          {cameras.length === 0 ? (
            <EmptyState Icon={FaCameraRetro} message="No cameras yet. Add a camera from the Add Camera tab." />
          ) : (
            <div className="max-h-screen overflow-y-auto pr-2">
              <CameraTable />
            </div>
          )}
        </div>
      )}

      {activeTab === 'add' && (
        <form onSubmit={handleAddCamera} className="space-y-4 max-w-lg">
          <TableInput label="Camera Name *" name="name" value={newCam.name} onChange={(e) => handleChange(e, setNewCam)} placeholder="e.g., Hallway Camera 1" />
          <TableInput label="Stream URL *" name="url" value={newCam.url} onChange={(e) => handleChange(e, setNewCam)} placeholder="rtsp://..." type="url" />
          <TableInput label="Location *" name="locId" value={newCam.locId} onChange={(e) => handleChange(e, setNewCam)} options={locations} />
          <div className="flex gap-3">
            <button type="submit" className="flex-1 bg-green-600 text-white py-3 rounded-lg hover:bg-green-700 font-bold flex items-center justify-center">
              <FaPlus className="mr-2" /> Add Camera
            </button>
            <button type="button" onClick={() => setActiveTab('list')} className="flex-1 bg-gray-500 text-white py-3 rounded-lg hover:bg-gray-600 font-bold">
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
              <button type="submit" className="px-6 py-3 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 flex items-center whitespace-nowrap">
                Add
              </button>
            </div>
          </form>
          {locations.length === 0 ? (
            <EmptyState Icon={FaMapMarkerAlt} message="No locations yet. Add one above to get started." />
          ) : (
            <div className="max-h-screen overflow-y-auto pr-2">
              <LocationTable />
            </div>
          )}
        </div>
      )}

      <Modal
        isOpen={publishModal.open}
        onClose={() => setPublishModal({ open: false, id: null })}
        title={`Confirm ${publishedCameras.has(publishModal.id) ? 'Unpublish' : 'Publish'}`}
        message={publishedCameras.has(publishModal.id) 
          ? 'Unpublish this camera from MediaMTX? It will no longer be available via HLS/WebRTC.'
          : 'Publish this camera to MediaMTX so it becomes available via HLS/WebRTC. Continue?'}
        icon={FaCameraRetro}
        confirmText={publishedCameras.has(publishModal.id) ? 'Unpublish Camera' : 'Publish Camera'}
        onConfirm={handlePublishCamera}
        isDangerous={false}
      />

      <Modal
        isOpen={deleteModal.open && deleteModal.type === 'camera'}
        onClose={() => setDeleteModal({ open: false, type: '', id: null })}
        title="Confirm Deletion"
        message={`Are you sure you want to delete ${cameras.find(c => c.id === deleteModal.id)?.name || 'this camera'}?`}
        warning={deleteModal.type === 'camera' ? 'This action cannot be undone.' : null}
        icon={FaTrash}
        confirmText="Delete Camera"
        onConfirm={handleDeleteCamera}
        isDangerous={true}
      />

      <Modal
        isOpen={deleteModal.open && deleteModal.type === 'location'}
        onClose={() => setDeleteModal({ open: false, type: '', id: null })}
        title="Confirm Deletion"
        message={`Are you sure you want to delete ${locations.find(l => l.id === deleteModal.id)?.name || 'this location'}?`}
        warning="⚠️ WARNING: You must re-assign or remove all cameras using this location before deletion."
        icon={FaTrash}
        confirmText="Delete Location"
        onConfirm={handleDeleteLocation}
        isDangerous={true}
      />
    </div>
  );
}
