import React, { useState } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
// Import login function
import { loginUser } from './services/apiService.js'; 

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
  const [user, setUser] = useState(null); 

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
        // API call was successful, set the user state
        setUser({ 
          username: data.username, 
          role: 'admin', // You can get this from the API response
          userId: data.user_id,
          token: data.access_token 
        });
        return { success: true };
      } else {
        // Handle cases where the API returns a logical error
        return { success: false, message: data.message || 'Login failed.' };
      }

    } catch (error) {
      // Handle network errors or 401/500 errors from fetchApi
      console.error('Login API error:', error);
      return { success: false, message: error.message || 'Invalid credentials or server error.' };
    }
  };

  /**
   * Logout function
   */
  const logout = () => {
    setUser(null);
  };

  const authProps = { user, logout, cameras };

  return (
    <div className="flex flex-col min-h-screen">
      {/* 🔌 Connection status indicator (always visible) */}
      <ConnectionStatus />

      {/* Conditionally render Header for authenticated users */}
      {user && <Header user={user} logout={logout} />}
      
      {/* This <main> tag wraps all pages and makes them grow to fill space */}
      <main className="flex-grow bg-gray-100">
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