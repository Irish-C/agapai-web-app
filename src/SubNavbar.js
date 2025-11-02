import React from 'react';

/**
 * This is the Secondary Gray Contextual Bar.
 * Its content changes based on the 'activePage' prop.
 */
export default function SubNavbar({ activePage, cameraLayout, setCameraLayout }) {

  // --- Render logic based on the active page ---
  const renderSubNav = () => {
    
    // 1. If on 'Live View' or 'Camera Layout', show layout controls
    // (This matches your mockup ...205941.png)
    if (activePage === 'Live View' || activePage === 'Camera Layout') {
      return (
        <div className="flex items-center space-x-2">
          {/* These buttons match your mockup style */}
          <button className="px-3 py-1 bg-white rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50">Live View</button>
          <button className="px-3 py-1 bg-white rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50">Camera Layout</button>
          <button className="px-3 py-1 bg-white rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50">Reports</button>
          
          {/* This dropdown is now controlled by state from MainDashboard.js */}
          <select 
            value={cameraLayout} 
            onChange={(e) => setCameraLayout(e.target.value)}
            className="ml-4 p-1 rounded-md border-gray-300 text-sm"
          >
            <option value="2x2 Grid">2x2 Grid</option>
            <option value="Full Screen">Full Screen</option>
            {/* You can add more layouts here later, like '1x4' etc. */}
          </select>
        </div>
      );
    }

    // 2. If on 'Reports', show report filters
    if (activePage === 'Reports') {
      return (
        <div className="flex items-center space-x-3">
          <span className="text-sm font-medium text-gray-700">Filter by Date:</span>
          <input type="date" className="p-1 rounded-md border-gray-300 text-sm" />
          <button className="px-3 py-1 bg-teal-600 text-white rounded-md shadow-sm text-sm font-medium hover:bg-teal-700">Export</button>
        </div>
      );
    }
    
    // 3. If on an Admin page, show a title
    if (activePage === 'Manage Cameras' || activePage === 'Manage Users') {
       return (
        <div className="flex items-center">
          <span className="text-lg font-semibold text-gray-800">{activePage}</span>
        </div>
       );
    }

    // 4. By default, show nothing
    return null;
  };

  return (
    <div 
      className="px-4 py-2"
      style={{ backgroundColor: '#E0E0E0' }} // Your light gray
    >
      {renderSubNav()}
    </div>
  );
}