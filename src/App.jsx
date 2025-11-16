// src/App.jsx
import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { loginUser, fetchCameraList, logoutUser } from './services/apiService.js'; 
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
    // Authentication state
    const [user, setUser] = useState(() => {
        const storedUser = localStorage.getItem('user');
        return storedUser ? JSON.parse(storedUser) : null;
    });

    // State for camera data, initialized to an empty array
    const [cameras, setCameras] = useState([]);

    /**
     * Real login function that calls the API.
     */
    const login = async (username, password) => {
        try {
            const data = await loginUser(username, password);

            if (data.status === 'success' || data.token || data.access_token) {
                const userData = { 
                    username: data.username, 
                    // ✅ FIX: Use the role returned by the backend (data.role)
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
        <div className="flex flex-col min-h-screen">
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