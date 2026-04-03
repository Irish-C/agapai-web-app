import React from 'react';
import { FaSave } from 'react-icons/fa';
import { TableInput, ActionButtons } from './FormComponents';

export default function CameraTable({ cameras, locations, editingCam, setEditingCam, publishedCameras, onEdit, onDelete, onPublish, onUpdate, readOnly = false }) {
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

  return (
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
              <td className="px-4 py-3 text-gray-900 font-semibold w-1/4 truncate">{cam.name}</td>
              <td className="px-4 py-3 text-gray-700 w-1/4 truncate">{cam.location_name || 'Unknown'}</td>
              <td className="px-4 py-3 text-gray-600 text-sm w-3/10 truncate">{cam.stream_url}</td>
              <td className="px-4 py-3 w-1/5">
                {(() => {
                  if (readOnly) {
                    return <span className="text-gray-400 text-xs">View only</span>;
                  }

                  if (editingCam?.id === cam.id) {
                    // When editing, the inline action buttons are redundant because
                    // the expanded edit form below already provides Save/Cancel.
                    // Show a small editing indicator instead to avoid duplication.
                    return (
                      <div className="text-sm text-gray-600 font-medium">Editing...</div>
                    );
                  }

                  return (
                    <ActionButtons buttons={[
                      { label: 'Edit', onClick: () => onEdit(cam), className: 'bg-blue-600 text-white text-xs py-1 px-2 rounded hover:bg-blue-700 font-semibold disabled:opacity-50', disabled: locations.length === 0 },
                      { label: 'Delete', onClick: () => onDelete(cam.id), className: 'bg-red-600 text-white text-xs py-1 px-2 rounded hover:bg-red-700 font-semibold' },
                      { label: publishedCameras.has(cam.id) ? 'Unpublish' : 'Publish', onClick: () => onPublish(cam.id), className: publishedCameras.has(cam.id) ? 'bg-gray-600 text-white text-xs py-1 px-2 rounded hover:bg-gray-700 font-semibold' : 'bg-yellow-600 text-white text-xs py-1 px-2 rounded hover:bg-yellow-700 font-semibold' },
                    ]} />
                  );
                })()}
              </td>
            </tr>
            {!readOnly && editingCam?.id === cam.id && (
              <tr className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-100'}>
                <td colSpan="4" className="px-4 py-3">
                  <form onSubmit={onUpdate} className="space-y-3 bg-blue-50 p-4 rounded-lg border border-blue-200">
                    <div className="grid grid-cols-3 gap-4">
                      <TableInput label="Camera Name" name="cam_name" value={editingCam.cam_name} onChange={(e) => setEditingCam(p => ({ ...p, [e.target.name]: sanitizeCameraName(e.target.value) }))} />
                      <TableInput label="Stream URL" name="stream_url" value={editingCam.stream_url} onChange={(e) => setEditingCam(p => ({ ...p, [e.target.name]: sanitizeStreamUrl(e.target.value) }))} type="url" />
                      <TableInput label="Location" name="loc_id" value={editingCam.loc_id} onChange={(e) => setEditingCam(p => ({ ...p, [e.target.name]: sanitizeLocationId(e.target.value) }))} options={locations} />
                    </div>
                    <div className="flex gap-2 justify-end">
                      <button type="submit" className="bg-green-600 text-white py-2 px-6 rounded-lg hover:bg-green-700 text-sm font-semibold flex items-center">
                        <FaSave className="mr-2" /> Save
                      </button>
                      <button type="button" onClick={() => setEditingCam(null)} className="bg-gray-500 text-white py-2 px-6 rounded-lg hover:bg-gray-600 text-sm font-semibold">
                        Cancel
                      </button>
                    </div>
                  </form>
                </td>
              </tr>
            )}
          </React.Fragment>
        ))}
      </tbody>
    </table>
  );
}
