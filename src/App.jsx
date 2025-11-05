import React, { useState } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';

// Common components
import Header from './components/common/Header.jsx';
import Footer from './components/common/Footer.jsx';
import ConnectionStatus from "./components/ConnectionStatus.jsx";
import { loginUser } from './services/apiService.js';

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
   * Mock login function
   * @param {string} username 
   * @param {string} password 
   * @returns {boolean} True if login succeeds
   */
  const login = (username, password) => {
    if (username === 'admin' && password === 'password') {
      setUser({ username: 'Admin User', role: 'admin' });
      return true;
    }
    return false;
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
      {user && <Header username={user.username} logout={logout} />}
      
      <main className="flex-grow">
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<LoginPage login={login} />} />

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
          {/* Non-authenticated users redirect to the LandingPage at the root */}
          {!user && <Route path="*" element={<Navigate to="/" replace />} />} 
          {/* Authenticated users redirect to the Dashboard on invalid path */}
          {user && <Route path="*" element={<Navigate to="/dashboard" replace />} />}
        </Routes>
      </main>

      {/* Conditionally render Footer for authenticated users */}
      {user && <Footer />}
    </div>
  );
}