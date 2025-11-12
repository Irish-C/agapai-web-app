import React, { useState } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
// Import the real login function
import { loginUser } from './services/apiService.js'; 
import agapai_Bg from './assets/images/bg/gray-bg.png';

// Common components
import Header from './components/common/Header.jsx';
import Footer from './components/common/Footer.jsx';
import ConnectionStatus from "./components/ConnectionStatus.jsx";

// Pages
import LandingPage from './pages/LandingPage.jsx';
import LoginPage from './pages/LoginPage.jsx';
import MainPage from './pages/MainPage.jsx';
import ReportsPage from './pages/ReportsPage.jsx';
import Settings from './pages/SettingsPage.jsx';

/**
 * Main application component responsible for state management and routing.
 */
export default function App() {
  // Authentication state: user is null if logged out, or contains user data if logged in
const [user, setUser] = useState(() => {
    const storedUser = localStorage.getItem('user');
    // ...
    return storedUser ? JSON.parse(storedUser) : null;
});

// Mock cameras data (can be replaced with an API call later)
const [cameras] = useState([
    { id: 'cam1', name: 'House Sebastian', location: 'House Sebastian' },
    { id: 'cam2', name: 'House Charbel', location: 'House Charbel' },
    { id: 'cam3', name: 'House Emmanuel', location: 'House Emmanuel' },
    { id: 'cam4', name: 'House Gabriel', location: 'House Gabriel' },
]);

  /**
   * Real login function that calls the API.
   * This function is passed to LoginPage.
   * @param {string} username 
   * @param {string} password 
   * @returns {Promise<object>} An object { success: boolean, message?: string }
   */
  const login = async (username, password) => {
      try {
          // Call the API service
          const data = await loginUser(username, password);

          if (data.status === 'success') {
              // userData is defined (scoped) ONLY within this block
              const userData = { 
                  username: data.username, 
                  role: 'admin', 
                  userId: data.user_id,
                  token: data.access_token 
              };

              // Set the user state and store in localStorage
              setUser(userData);
              localStorage.setItem('user', JSON.stringify(userData));
              
              return { success: true };
          } else {
              // API call succeeded but returned a logical failure (e.g., wrong password)
              return { success: false, message: data.message || 'Login failed.' };
          }

      } catch (error) {
          // Execution jumps here if there is a network error or fetch failure.
          // DO NOT use 'userData' here, use the 'error' object.
          console.error('Login API error:', error); 
          return { success: false, message: error.message || 'Invalid credentials or server error.' };
      }
  };
  /**
   * Logout function
   */
  const logout = () => {
    setUser(null);
    localStorage.removeItem('user');
  };

  const authProps = { user, logout, cameras };

  return (
    <div className="flex flex-col min-h-screen">
      {/* 🔌 Connection status indicator (always visible) */}
      <ConnectionStatus />

      {/* Conditionally render Header for authenticated users */}
      {user && <Header user={user} logout={logout} />}
      
      {/* This <main> tag wraps all pages and makes them grow to fill space */}
      <main
      className="flex-grow min-h-screen bg-cover bg-center bg-no-repeat bg-fixed"
      style={{ backgroundImage: `url(${agapai_Bg})` }}
    >
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<LandingPage />} />
          <Route 
            path="/login" 
            element={!user ? <LoginPage login={login} /> : <Navigate to="/dashboard" replace />} 
          />

          {/* Protected Routes */}
          <Route 
            path="/dashboard" 
            element={user ? <MainPage {...authProps} /> : <Navigate to="/login" replace />} 
          />
          <Route 
            path="/reports" 
            element={user ? <ReportsPage {...authProps} /> : <Navigate to="/login" replace />} 
          />
          <Route 
            path="/settings" 
            element={user ? <Settings {...authProps} /> : <Navigate to="/login" replace />} 
          />

          {/* Fallbacks */}
          {!user && <Route path="*" element={<Navigate to="/" replace />} />} 
          {user && <Route path="*" element={<Navigate to="/dashboard" replace />} />}
        </Routes>
      </main>

      {/* Conditionally render Footer for authenticated users */}
      {user && <Footer />}
    </div>
  );
}