import React, { useState, useEffect } from 'react';

// Import your global styles
import './index.css'; 

// Import your two main pages from the 'pages' folder
import LoginPage from './pages/LoginPage.jsx';
import MainDashboard from './pages/MainDashboard.js';

function App() {
  // State to track if the user is logged in
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  
  // State to store the user's role (e.g., 'admin' or 'general')
  const [userRole, setUserRole] = useState(null);

  // --- Check for existing login on app load ---
  // This runs once when the app first opens
  useEffect(() => {
    const storedToken = localStorage.getItem('agapai_token');
    const storedRole = localStorage.getItem('agapai_role');

    if (storedToken && storedRole) {
      // If we find a token, assume the user is still logged in
      setIsLoggedIn(true);
      setUserRole(storedRole);
    }
  }, []);

  // --- Function to handle successful login ---
  // We will pass this function down to the LoginPage
  const handleLoginSuccess = (role) => {
    setIsLoggedIn(true);
    setUserRole(role);
    // The token and role are saved to localStorage inside LoginPage.jsx
  };

  // --- Function to handle logout ---
  // We will pass this to the MainDashboard, which passes it to the Navbar
  const handleLogout = () => {
    // Clear the stored token and role
    localStorage.removeItem('agapai_token');
    localStorage.removeItem('agapai_role');
    
    // Reset the state
    setIsLoggedIn(false);
    setUserRole(null);
  };

  // --- Render Logic ---
  return (
    <div className="App">
      {isLoggedIn ? (
        // If logged in, show the main dashboard
        // Pass the user's role and the logout function to it
        <MainDashboard userRole={userRole} onLogout={handleLogout} />
      ) : (
        // If not logged in, show the login page
        // Pass the login handler function to it
        <LoginPage onLoginSuccess={handleLoginSuccess} />
      )}
    </div>
  );
}

export default App;