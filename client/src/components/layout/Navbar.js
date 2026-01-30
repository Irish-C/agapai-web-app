// src/Navbar.js

// Define the navigation items
const generalNavItems = [
  { name: 'Live View', key: 'Live View' },
  { name: 'Camera Layout', key: 'Camera Layout' },
  { name: 'Reports', key: 'Reports' },
];

const adminNavItems = [
  { name: 'Manage Cameras', key: 'Manage Cameras' },
  { name: 'Manage Users', key: 'Manage Users' },
];

/**
 * This is the Main Teal Navigation Bar.
 * It receives all its logic/state as props from MainDashboard.js.
 */
export default function Navbar({ activePage, setActivePage, onLogout, userRole }) {
  
  return (
    <nav 
      className="flex justify-between items-center px-4 h-14" 
      style={{ backgroundColor: '#3FA7A0' }} // Your teal color
    >
      <div className="flex space-x-4">
        
        {/* --- General User Links --- */}
        {generalNavItems.map((item) => (
          <button
            key={item.key}
            // 1. Call the function from MainDashboard to change the page
            onClick={() => setActivePage(item.name)} 
            // 2. Apply a different style if this is the active page
            className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
              activePage === item.name
                ? 'bg-teal-700 text-white shadow-inner' // Active style
                : 'text-white hover:bg-teal-600'      // Inactive style
            }`}
          >
            {item.name}
          </button>
        ))}

        {/* --- Admin-Only Links --- */}
        {userRole === 'admin' && adminNavItems.map((item) => (
           <button
            key={item.key}
            onClick={() => setActivePage(item.name)}
            className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
              activePage === item.name
                ? 'bg-teal-700 text-white shadow-inner' // Active style
                : 'text-yellow-300 hover:bg-teal-600 hover:text-white' // Admin-specific style
            }`}
          >
            {item.name}
          </button>
        ))}

      </div>

      {/* --- Logout Button --- */}
      <button 
        // 3. Call the logout function from App.js -> MainDashboard.js
        onClick={onLogout}
        className="px-3 py-1 rounded-md text-sm font-medium text-white bg-red-600 hover:bg-red-700 transition-colors"
      >
        Logout
      </button>
    </nav>
  );
}