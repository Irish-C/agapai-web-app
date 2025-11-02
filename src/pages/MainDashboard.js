import React, { useState } from 'react';

// --- Import your navigation components ---
// (Assuming Navbar.js and SubNavbar.js are in the src root, as per your screenshot)
import Navbar from '../Navbar.js'; 
import SubNavbar from '../SubNavbar.js';

// --- Import your page content components ---
import CameraGrid from '../components/CameraGrid.jsx';

// --- Placeholder for Reports Page ---
// (We will create this component later)
const ReportsPage = () => {
  return (
    <div className="p-4 bg-white rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold mb-4">Fall and Inactivity Reports</h2>
      <p>(This is where your charts from QuestDB will be rendered)</p>
    </div>
  );
};


/**
 * This is the main component for a logged-in user.
 * It receives 'userRole' and 'onLogout' from App.js.
 */
export default function MainDashboard({ userRole, onLogout }) {
  
  // State to track the active page (from the main teal bar)
  // 'Live View' is the default.
  const [activePage, setActivePage] = useState('Live View');
  
  // State for the camera layout (from the gray sub-nav dropdown)
  // This state will be passed to both SubNavbar and CameraGrid.
  const [cameraLayout, setCameraLayout] = useState('2x2 Grid');

  // Function to decide which content to show
  const renderPageContent = () => {
    switch (activePage) {
      case 'Reports':
        return <ReportsPage />;
      
      // Both 'Live View' and 'Camera Layout' will show the grid
      case 'Live View':
      case 'Camera Layout':
      default:
        // We pass the layout state to CameraGrid
        // (You will need to add logic to CameraGrid to use this prop)
        return <CameraGrid layout={cameraLayout} />;
    }
  };

  return (
    // Main container for the logged-in view
    <div className="min-h-screen">
      
      {/* 1. HEADER (Dark Blue Bar from ...205924.png) */}
      <div 
        className="flex justify-between items-center px-4 h-16" 
        style={{ backgroundColor: '#1E3A5F' }} // Your dark blue
      >
        <div className="flex items-center">
          {/* Using the logo path from your 'images' folder */}
          <img src="/images/logo/agapai-logo.png" alt="AGAPAI Logo" className="h-10 w-10 mr-3" />
          <span className="text-white text-lg font-semibold">
            AGAPAI: A Vision-Based Monitoring and Alert System...
          </span>
        </div>
        <button 
          className="text-gray-800 bg-gray-200 px-4 py-1 rounded-md font-medium"
        >
          Settings
        </button>
      </div>

      {/* 2. MAIN NAVBAR (Teal Bar) */}
      <Navbar 
        activePage={activePage} 
        setActivePage={setActivePage} 
        onLogout={onLogout} // Pass the logout function from App.js
        userRole={userRole} // Pass the role for conditional admin links
      />

      {/* 3. SUB-NAVBAR (Gray Bar) */}
      <SubNavbar 
        activePage={activePage}
        cameraLayout={cameraLayout}
        setCameraLayout={setCameraLayout} // Pass the state setter
      />

      {/* 4. MAIN CONTENT AREA */}
      <main className="p-4">
        {renderPageContent()}
      </main>
    </div>
  );
}