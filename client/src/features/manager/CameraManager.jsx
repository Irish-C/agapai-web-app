import React, { useState, useEffect } from 'react';
import { FaPlus, FaCameraRetro, FaMapMarkerAlt, FaTrash, FaUndo } from 'react-icons/fa';
import { useCameraManager } from '../../hooks/useCameraManager';
import { useLocationManager } from '../../hooks/useLocationManager';
import Modal from '../../components/Modal';
import CameraTable from '../../components/CameraTable';
import LocationTable from '../../components/LocationTable';
import { TableInput, EmptyState } from '../../components/FormComponents';
import { messageClass, tabButtonClass } from '../../utils/uiConstants';

const ensureSubtype = (url) => {
  if (!url) return url;
  if (!url.includes('subtype=')) {
    const separator = url.includes('?') ? '&' : '?';
    return `${url}${separator}subtype=1`;
  }
  return url;
};

export default function CameraManager({ locations: initialLocations, onCameraUpdated, readOnly = false }) {
  const [activeTab, setActiveTab] = useState('list');
  const [deleteModal, setDeleteModal] = useState({ open: false, type: '', id: null });
  const [permanentDeleteModal, setPermanentDeleteModal] = useState({ open: false, id: null, name: '' });
  const [archivedCameras, setArchivedCameras] = useState([]);

  const cam = useCameraManager(onCameraUpdated);
  const loc = useLocationManager();

  const sanitizeCameraName = (value) => {
    if (typeof value !== 'string') return '';
    return value
      .replace(/[<>`"']/g, '')
      .replace(/\s{2,}/g, ' ')
      .trimStart()
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

  const sanitizeLocationName = (value) => {
    if (typeof value !== 'string') return '';
    return value
      .replace(/[<>`"']/g, '')
      .replace(/\s{2,}/g, ' ')
      .trimStart()
      .slice(0, 100);
  };

  useEffect(() => {
    cam.fetchCameras();
    loc.fetchLocations();
  }, []);

  const fetchArchivedCameras = async () => {
    try {
      const response = await fetch('/api/cameras/archived', {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('authToken')}` }
      });
      if (response.ok) {
        const data = await response.json();
        setArchivedCameras(data.archived_cameras || []);
      }
    } catch (err) {
      console.error('Failed to fetch archived cameras:', err);
      cam.setMessage({ text: 'Failed to load archived cameras', type: 'error' });
    }
  };

  const handleRestoreCamera = async (cameraId) => {
    try {
      const response = await fetch(`/api/cameras/${cameraId}/restore`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('authToken')}` }
      });
      if (response.ok) {
        cam.setMessage({ text: 'Camera restored and auto-published successfully!', type: 'success' });
        await fetchArchivedCameras();
        await cam.fetchCameras();
      } else {
        const err = await response.json();
        cam.setMessage({ text: `Restore failed: ${err.error || 'Unknown error'}`, type: 'error' });
      }
    } catch (err) {
      cam.setMessage({ text: `Restore error: ${err.message}`, type: 'error' });
    }
  };

  const handlePermanentDelete = async (cameraId) => {
    try {
      const response = await fetch(`/api/cameras/${cameraId}/permanent`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('authToken')}` }
      });
      if (response.ok) {
        cam.setMessage({ text: 'Camera permanently deleted!', type: 'success' });
        setPermanentDeleteModal({ open: false, id: null, name: '' });
        await fetchArchivedCameras();
      } else {
        const err = await response.json();
        cam.setMessage({ text: `Delete failed: ${err.error || 'Unknown error'}`, type: 'error' });
      }
    } catch (err) {
      cam.setMessage({ text: `Delete error: ${err.message}`, type: 'error' });
    }
  };

  useEffect(() => {
    if (loc.locations.length > 0 && !cam.newCam.locId) cam.setNewCam(p => ({ ...p, locId: loc.locations[0].id }));
    if (cam.editingCam && !cam.editingCam.loc_id && loc.locations.length > 0) cam.setEditingCam(p => ({ ...p, loc_id: loc.locations[0].id }));
  }, [loc.locations]);

  const handleAddCamera = async (e) => {
    e.preventDefault();
    if (await cam.addCamera({ cam_name: cam.newCam.name, stream_url: ensureSubtype(cam.newCam.url), loc_id: parseInt(cam.newCam.locId) })) setActiveTab('list');
  };

  const handleUpdateCamera = async (e) => {
    e.preventDefault();
    if (!cam.editingCam.cam_name.trim()) { cam.setMessage({ text: 'Camera name cannot be empty.', type: 'error' }); return; }
    await cam.updateCamera(cam.editingCam.id, { cam_name: cam.editingCam.cam_name, stream_url: ensureSubtype(cam.editingCam.stream_url), loc_id: parseInt(cam.editingCam.loc_id) || loc.locations[0]?.id });
  };

  const handleAddLocation = async (e) => {
    e.preventDefault();
    if (await loc.addLocation(loc.newLocName)) setActiveTab('locations');
  };

  return (
    <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-200">
      <h2 className="text-2xl font-bold text-gray-900 flex items-center mb-6 pb-4 border-b">
        <FaCameraRetro className="mr-3 text-cyan-600" /> Camera Management
      </h2>

      {cam.message.text && <div className={`mb-6 p-4 border rounded-lg font-medium ${messageClass(cam.message)}`}>{cam.message.text}</div>}
      {loc.message.text && <div className={`mb-6 p-4 border rounded-lg font-medium ${messageClass(loc.message)}`}>{loc.message.text}</div>}
      {readOnly && (
        <div className="mb-6 p-4 border rounded-lg font-medium bg-blue-50 border-blue-200 text-blue-700">
          View-only mode: only administrators can add, edit, delete, or publish cameras and locations.
        </div>
      )}

      <div className="flex gap-2 mb-12">
        <button onClick={() => setActiveTab('list')} className={tabButtonClass(activeTab === 'list')}>Camera List ({cam.cameras.length})</button>
        {!readOnly && <button onClick={() => setActiveTab('add')} className={tabButtonClass(activeTab === 'add')}>Add Camera</button>}
        <button onClick={() => { setActiveTab('locations'); }} className={tabButtonClass(activeTab === 'locations')}>Locations ({loc.locations.length})</button>
        {!readOnly && <button onClick={() => { setActiveTab('archived'); fetchArchivedCameras(); }} className={tabButtonClass(activeTab === 'archived')}>Archived Cameras</button>}
      </div>

      {activeTab === 'list' && (
        cam.cameras.length === 0 
          ? <EmptyState Icon={FaCameraRetro} message="No cameras yet. Add a camera from the Add Camera tab." />
          : <div className="max-h-screen overflow-y-auto pr-2"><CameraTable cameras={cam.cameras} locations={loc.locations} editingCam={cam.editingCam} setEditingCam={cam.setEditingCam} onEdit={(c) => cam.setEditingCam({ ...c, cam_name: c.name, stream_url: c.stream_url || '', loc_id: c.location_id || loc.locations[0]?.id })} onDelete={(id) => setDeleteModal({ open: true, type: 'camera', id })} onUpdate={handleUpdateCamera} readOnly={readOnly} /></div>
      )}

      {!readOnly && activeTab === 'add' && (
        <form onSubmit={handleAddCamera} className="space-y-4 max-w-lg bg-white p-6 rounded-xl border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Add New Camera</h3>
          <TableInput label="Camera Name" name="name" value={cam.newCam.name} onChange={(e) => cam.setNewCam(p => ({ ...p, [e.target.name]: sanitizeCameraName(e.target.value) }))} placeholder="e.g., Hallway Camera 1" />
          <TableInput label="Stream URL" name="url" value={cam.newCam.url} onChange={(e) => cam.setNewCam(p => ({ ...p, [e.target.name]: sanitizeStreamUrl(e.target.value) }))} placeholder="rtsp://..." type="url" />
          <TableInput label="Location" name="locId" value={cam.newCam.locId} onChange={(e) => cam.setNewCam(p => ({ ...p, [e.target.name]: sanitizeLocationId(e.target.value) }))} options={loc.locations} />
          <div className="flex gap-3 pt-6">
            <button type="submit" className="flex-1 bg-green-600 text-white py-3 rounded-xl hover:bg-green-700 font-bold flex items-center justify-center transition-colors">Add Camera</button>
            <button type="button" onClick={() => setActiveTab('list')} className="flex-1 bg-gray-500 text-white py-3 rounded-xl hover:bg-gray-600 font-bold transition-colors">Cancel</button>
          </div>
        </form>
      )}

      {activeTab === 'locations' && (
        <>
          {!readOnly && (
            <>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Add New Location</h3>
              <form onSubmit={handleAddLocation} className="flex gap-3 mb-6" style={{ maxWidth: '400px' }}>
                <input type="text" value={loc.newLocName} onChange={(e) => loc.setNewLocName(sanitizeLocationName(e.target.value))} className="flex-1 pl-4 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 outline-none transition-all placeholder:text-gray-300 text-base" placeholder="e.g., Main Lobby..." required />
                <button type="submit" className="px-6 py-3 bg-green-600 text-white font-semibold rounded-xl hover:bg-green-700 whitespace-nowrap transition-colors">Add Location</button>
              </form>
            </>
          )}
          {loc.locations.length === 0
            ? <EmptyState Icon={FaMapMarkerAlt} message="No locations yet. Add one above to get started." />
            : <div className="max-h-screen overflow-y-auto pr-2"><LocationTable locations={loc.locations} editingLoc={loc.editingLoc} setEditingLoc={loc.setEditingLoc} onEdit={(l) => loc.setEditingLoc({ ...l })} onDelete={(id) => setDeleteModal({ open: true, type: 'location', id })} onUpdate={(e) => { e.preventDefault(); loc.updateLocation(loc.editingLoc.id, loc.editingLoc.name); }} readOnly={readOnly} /></div>
          }
        </>
      )}

      {activeTab === 'archived' && (
        <div className="space-y-4">
          <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 p-4 rounded-lg text-sm">
            <strong> ℹ  Archived Cameras:</strong> Deleted cameras are archived to preserve event history and camera linkages. You can restore them to active status below.
          </div>
          {archivedCameras.length === 0 
            ? <EmptyState Icon={FaCameraRetro} message="No archived cameras. All cameras are active." />
            : (
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="bg-gray-200">
                      <th className="px-4 py-3 text-left font-semibold text-gray-900">Original Name</th>
                      <th className="px-4 py-3 text-left font-semibold text-gray-900">Current Status</th>
                      <th className="px-4 py-3 text-left font-semibold text-gray-900">Location</th>
                      <th className="px-4 py-3 text-left font-semibold text-gray-900">Stream URL</th>
                      <th className="px-4 py-3 text-center font-semibold text-gray-900">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {archivedCameras.map((cam, idx) => (
                      <tr key={cam.id} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-100'}>
                        <td className="px-4 py-3 text-gray-900 font-semibold">{cam.original_name}</td>
                        <td className="px-4 py-3 text-gray-700">Archived</td>
                        <td className="px-4 py-3 text-gray-700">{cam.location_name || 'Unknown'}</td>
                        <td className="px-4 py-3 text-gray-600 text-sm truncate">{cam.stream_url}</td>
                        <td className="px-4 py-3 text-center">
                          <button 
                            onClick={() => handleRestoreCamera(cam.id)} 
                            className="bg-green-600 text-white text-xs py-1 px-3 rounded hover:bg-green-700 font-semibold"
                          >
                            Restore
                          </button>
                          <button 
                            onClick={() => setPermanentDeleteModal({ open: true, id: cam.id, name: cam.original_name })} 
                            className="bg-red-600 text-white text-xs py-1 px-3 rounded hover:bg-red-700 font-semibold ml-2"
                          >
                            Delete Permanently
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )
          }
        </div>
      )}

      <Modal isOpen={deleteModal.open && deleteModal.type === 'camera'} onClose={() => setDeleteModal({ open: false, type: '', id: null })} title="Archive Camera?" message={`Archive ${cam.cameras.find(c => c.id === deleteModal.id)?.name || 'camera'}?`} warning="The camera will be moved to Archived and can be restored later." icon={FaTrash} confirmText="Archive" onConfirm={() => { cam.deleteCamera(deleteModal.id); setDeleteModal({ open: false, type: '', id: null }); }} isDangerous={false} />
      <Modal isOpen={deleteModal.open && deleteModal.type === 'location'} onClose={() => setDeleteModal({ open: false, type: '', id: null })} title="Confirm Deletion" message={`Delete ${loc.locations.find(l => l.id === deleteModal.id)?.name || 'location'}?`} warning="⚠️ Reassign/remove all cameras first." icon={FaTrash} confirmText="Delete" onConfirm={() => { loc.deleteLocation(deleteModal.id); setDeleteModal({ open: false, type: '', id: null }); }} isDangerous={true} />
      <Modal isOpen={permanentDeleteModal.open} onClose={() => setPermanentDeleteModal({ open: false, id: null, name: '' })} title="Permanently Delete Camera?" message={`Permanently delete "${permanentDeleteModal.name}"? This cannot be undone.`} warning="⚠️ This will delete all camera data from the database. Events linked to this camera will lose the camera reference." icon={FaTrash} confirmText="Delete Permanently" onConfirm={() => { handlePermanentDelete(permanentDeleteModal.id); }} isDangerous={true} />
      <Modal isOpen={deleteModal.open && deleteModal.type === 'location'} onClose={() => setDeleteModal({ open: false, type: '', id: null })} title="Confirm Deletion" message={`Delete ${loc.locations.find(l => l.id === deleteModal.id)?.name || 'location'}?`} warning="⚠️ Reassign/remove all cameras first." icon={FaTrash} confirmText="Delete" onConfirm={() => { loc.deleteLocation(deleteModal.id); setDeleteModal({ open: false, type: '', id: null }); }} isDangerous={true} />
    </div>
  );
}
