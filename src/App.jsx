// src/App.jsx
import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { loginUser, fetchCameraList, logoutUser } from './services/apiService.js';
import agapai_Bg from './assets/images/bg/gray-bg.png';
import { socket } from './socket'; // Ensure this points to your socket.js

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

// --- NEW: Global Alert Component ---
const GlobalAlertModal = ({ alert, onClose }) => {
  if (!alert) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-70 animate-pulse">
      <div className="bg-white border-4 border-red-600 rounded-lg shadow-2xl p-8 max-w-lg w-full text-center">
        <div className="text-6xl mb-4">🚨</div>
        <h2 className="text-3xl font-bold text-red-700 mb-2">FALL DETECTED!</h2>
        <p className="text-xl text-gray-800 mb-6">
          {/* Location: <strong>{alert.location}</strong> */}
        </p>
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4">
          <strong className="font-bold">Hardware Alarm Active. </strong>
          <span className="block sm:inline">Check the patient immediately!</span>
        </div>
        <p className="text-sm text-gray-500 mb-4">
            Press the physical button on the device to stop the alarm.
        </p>
        <button 
          onClick={onClose}
          className="bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-6 rounded-lg text-lg w-full"
        >
          Close Popup
        </button>
      </div>
    </div>
  );
};

/**
 * Main application component responsible for state management and routing.
 */
export default function App() {
    // Authentication state
    const [user, setUser] = useState(() => {
        const storedUser = localStorage.getItem('user');
        return storedUser ? JSON.parse(storedUser) : null;
    });

    // State for camera data, initialized to an empty array
    const [cameras, setCameras] = useState([]);

    // --- NEW: Alert State ---
    const [currentAlert, setCurrentAlert] = useState(null);

    // --- NEW: Socket Listener for Alerts ---
    useEffect(() => {
        
        // 1. Listen for the 'incident_alert' event from backend
        const handleAlert = (data) => {
            console.log("⚠️ ALERT RECEIVED:", data);
            setCurrentAlert(data);
        };

        // 2. Listen for 'alert_acknowledged' (if button is pressed, close popup)
        const handleAck = () => {
             console.log("✅ Alert acknowledged via hardware button.");
             setCurrentAlert(null);
        };

        socket.on('incident_alert', handleAlert);
        socket.on('alert_acknowledged', handleAck);

        // Cleanup listeners
        return () => {
            socket.off('incident_alert', handleAlert);
            socket.off('alert_acknowledged', handleAck);
        };
    }, []);

    /**
     * Real login function that calls the API.
     */
    const login = async (username, password) => {
        try {
            const data = await loginUser(username, password);

            if (data.status === 'success' || data.token || data.access_token) {
                const userData = {
                    username: data.username,
                    // Use the role returned by the backend (data.role)
                    role: data.role,
                    userId: data.user_id,
                    token: data.access_token || data.token
                };

                // Set the user state and store in localStorage
                setUser(userData);
                localStorage.setItem('user', JSON.stringify(userData));

                return { success: true };
            } else {
                return { success: false, message: data.message || 'Login failed.' };
            }

        } catch (error) {
            console.error('Login API error:', error);
            return { success: false, message: error.message || 'Invalid credentials or server error.' };
        }
    };

    /**
     * Logout function
     */
    const logout = () => {
        logoutUser();
        setUser(null);
        localStorage.removeItem('user');
    };

    /**
     * Fetches the list of cameras from the API.
     */
    const loadCameras = async () => {
        if (!user) {
            setCameras([]);
            return;
        }

        try {
            const cameraList = await fetchCameraList();
            setCameras(cameraList);

        } catch (error) {
            console.error('Failed to fetch cameras:', error);
            setCameras([]);
        }
    };

    /**
     * Effect to fetch cameras once the user state is set.
     */
    useEffect(() => {
        if (user) {
            loadCameras();
        } else {
            setCameras([]);
        }
    }, [user]);

    const authProps = { user, logout, cameras };

    return (
        <div className="flex flex-col min-h-screen relative">
            {/* RENDER THE ALERT MODAL AT THE TOP LEVEL */}
            <GlobalAlertModal alert={currentAlert} onClose={() => setCurrentAlert(null)} />
            <ConnectionStatus onLogout={logout} />

            {user && <Header user={user} logout={logout} />}

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

            {user && <Footer />}
        </div>
    );
}