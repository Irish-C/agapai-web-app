import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from './src/components/AuthContext.jsx';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';

//image
import agapai_Bg from './src/assets/bg/gray-bg.png';

// services
import { loginUser, fetchCameraList, logoutUser } from './src/services/apiService.js';


// helpers
import { normalizeRole } from './src/utils/roleUtils.js';

// components
import Header from './src/components/layout/Header.jsx';
import Footer from './src/components/layout/Footer.jsx';
import ConnectionStatus from "./src/components/ConnectionStatus.jsx";

// Pages
import LandingPage from './src/pages/LandingPage.jsx';
import LoginPage from './src/pages/LoginPage.jsx';
import MainPage from './src/pages/MainPage.jsx';
import ReportsPage from './src/pages/ReportsPage.jsx';
import Settings from './src/pages/SettingsPage.jsx';



export default function App() {
    // Use AuthContext for authentication state
    const { user, token, login, logout, isAuthReady } = useContext(AuthContext);
    const location = useLocation();

    const [cameras, setCameras] = useState([]);

    // Track location and save to localStorage
    useEffect(() => {
        if (location.pathname !== '/login' && location.pathname !== '/') {
            localStorage.setItem('lastPage', location.pathname);
        }
    }, [location]);



    const loadCameras = async () => {
        if (!user) return;
        try {
            const cameraList = await fetchCameraList();
            setCameras(cameraList);
        } catch (error) {
            console.error('Failed to fetch cameras:', error);
            setCameras([]);
        }
    };



    useEffect(() => {
        if (user) loadCameras();
        else setCameras([]);
    }, [user]);

    const authProps = { user, logout, cameras };

    return (
        <div
            className="flex flex-col min-h-screen relative font-sans bg-cover bg-center bg-no-repeat bg-fixed"
            style={{ backgroundImage: `url(${agapai_Bg})` }}
        >
            <ConnectionStatus onLogout={logout} />

            {user && <Header user={user} logout={logout} />}

            <main className="flex-grow min-h-screen">
                {!isAuthReady ? (
                    <div className="flex items-center justify-center min-h-screen">
                        <div className="text-gray-600">Loading...</div>
                    </div>
                ) : (
                    <Routes>
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

                        {/* Fallbacks - redirect to last saved page or dashboard */}
                        <Route path="*" element={<Navigate to={user ? (localStorage.getItem('lastPage') || "/dashboard") : "/"} replace />} />
                    </Routes>
                )}
            </main>

            {user && <Footer />}
        </div>
    );
}