import React from 'react';
import { TableInput, ActionButtons } from './FormComponents';

export default function LocationTable({ locations, editingLoc, setEditingLoc, onEdit, onDelete, onUpdate, readOnly = false }) {
  const sanitizeLocationName = (value) => {
    if (typeof value !== 'string') return '';
    return value
      .replace(/[<>`"']/g, '')
      .replace(/\s{2,}/g, ' ')
      .trimStart()
      .slice(0, 100);
  };

  return (
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
              <td className="px-4 py-3 text-gray-900 font-semibold w-4/5 truncate">{loc.name}</td>
              <td className="px-4 py-3 w-1/5">
                {(() => {
                  if (readOnly) {
                    return <span className="text-gray-400 text-xs">View only</span>;
                  }

                  if (editingLoc?.id === loc.id) {
                    return (
                      <ActionButtons buttons={[
                        { label: 'Save', onClick: onUpdate, className: 'bg-green-600 text-white text-xs py-1 px-2 rounded hover:bg-green-700 font-semibold' },
                        { label: 'Cancel', onClick: () => setEditingLoc(null), className: 'bg-gray-500 text-white text-xs py-1 px-2 rounded hover:bg-gray-600 font-semibold' },
                      ]} />
                    );
                  }

                  return (
                    <ActionButtons buttons={[
                      { label: 'Edit', onClick: () => onEdit(loc), className: 'bg-blue-600 text-white text-xs py-1 px-2 rounded hover:bg-blue-700 font-semibold' },
                      { label: 'Delete', onClick: () => onDelete(loc.id), className: 'bg-red-600 text-white text-xs py-1 px-2 rounded hover:bg-red-700 font-semibold' },
                    ]} />
                  );
                })()}
              </td>
            </tr>
            {!readOnly && editingLoc?.id === loc.id && (
              <tr className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-100'}>
                <td colSpan="2" className="px-4 py-3">
                  <form onSubmit={onUpdate} className="space-y-3 bg-blue-50 p-4 rounded-lg border border-blue-200">
                    <TableInput label="Location Name" name="name" value={editingLoc.name} onChange={(e) => setEditingLoc(p => ({ ...p, name: sanitizeLocationName(e.target.value) }))} />
                    <div className="flex gap-2 justify-end">
                      <button type="submit" className="bg-green-600 text-white py-2 px-6 rounded-lg hover:bg-green-700 text-sm font-semibold">
                        Save
                      </button>
                      <button type="button" onClick={() => setEditingLoc(null)} className="bg-gray-500 text-white py-2 px-6 rounded-lg hover:bg-gray-600 text-sm font-semibold">
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
