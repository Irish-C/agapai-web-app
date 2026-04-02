import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from './src/components/AuthContext.jsx';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';

//image
import agapai_Bg from './src/assets/bg/gray-bg.png';

// services
import { loginUser, fetchCameraList, logoutUser } from './src/services/apiService.js';
import { socket, registerOnBufferFlush, unregisterOnBufferFlush } from './src/services/socket.js';

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

// --- Global Alert Component ---
const GlobalAlertModal = ({ alert, onClose }) => {
    if (!alert) return null;

    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80">
            
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95
                animate-out fade-out zoom-out-95 shadow-[0_0_60px_rgba(239,68,68,0.5)] ring-2 ring-red-600/60">
                
                {/* Top Alert Bar */}
                <div className="bg-red-600 text-white py-2 px-4 flex items-center justify-center gap-2">
                    <span className="text-sm font-semibold tracking-wide">
                        EMERGENCY ALERT
                    </span>
                </div>

                <div className="p-6 text-center">

                    {/* Title */}
                    <h2 className="text-2xl font-bold text-red-700 mb-2">
                        {alert.type
                            ? `${alert.type.toUpperCase()} DETECTED`
                            : "ALERT DETECTED"}
                    </h2>

                    {/* Location */}
                    <p className="text-sm text-gray-700 mb-4">
                        Location:{" "}
                        <span className="font-semibold underline">
                            {alert.location || "Unknown Area"}
                        </span>
                    </p>

                    {/* Snapshot */}
                    {alert.snapshot_url && (
                        <div className="mb-4">
                            <img
                                src={alert.snapshot_url}
                                alt="Alert snapshot"
                                className="w-full max-w-xs mx-auto rounded-lg border border-gray-300 shadow-sm"
                            />
                        </div>
                    )}

                    {/* Warning Text */}
                    <p className="text-sm text-red-600 font-medium mb-5">
                        Alarm is actively sounding on the device
                    </p>

                    {/* Button */}
                    <button
                        onClick={onClose}
                        className="w-full bg-red-600 hover:bg-red-700 text-white font-semibold py-2.5 rounded-xl transition-all duration-200 shadow-md hover:shadow-lg active:scale-95"
                    >
                        Dismiss Alert
                    </button>
                </div>
            </div>
        </div>
    );
};

export default function App() {
    // Use AuthContext for authentication state
    const { user, token, login, logout, isAuthReady } = useContext(AuthContext);
    const location = useLocation();

    const [cameras, setCameras] = useState([]);
    const [currentAlert, setCurrentAlert] = useState(null);

    // Track location and save to localStorage
    useEffect(() => {
        if (location.pathname !== '/login' && location.pathname !== '/') {
            localStorage.setItem('lastPage', location.pathname);
        }
    }, [location]);

    // --- SOCKET LOGIC ---
    useEffect(() => {
        // 1. Listen for new alerts (Matches backend: socketio.emit('new_alert'))
        const handleAlert = (data) => {
            console.log("⚠️ EMERGENCY ALERT RECEIVED:", data);
            
            // Optional: Play a sound notification
            // const audio = new Audio('/alert-sound.mp3');
            // audio.play().catch(e => console.error("Audio error:", e));

            setCurrentAlert(data);
        };

        // 2. Listen for hardware acknowledgement
        const handleAck = () => {
             console.log("✅ Alert cleared via hardware/external system.");
             setCurrentAlert(null);
        };

        // 3. Handle missed alerts after reconnection
        const handleBufferFlush = (missedAlerts) => {
            console.log("📡 SYNCED MISSED ALERTS:", missedAlerts.length, "alerts");
            
            // Process missed alerts in reverse chronological order (oldest first)
            // This ensures the display updates show alerts in temporal sequence
            for (const alert of [...missedAlerts].reverse()) {
                console.log("  - Syncing missed alert:", alert.type, "at", alert.timestamp);
            }
            
            // Show the most recent missed alert if any exist
            if (missedAlerts.length > 0) {
                const mostRecentAlert = missedAlerts[0];
                console.log("🔔 Displaying most recent missed alert");
                setCurrentAlert(mostRecentAlert);
            }
        };

        socket.on('new_alert', handleAlert);
        socket.on('alert_acknowledged', handleAck);
        registerOnBufferFlush(handleBufferFlush);

        return () => {
            socket.off('new_alert', handleAlert);
            socket.off('alert_acknowledged', handleAck);
            unregisterOnBufferFlush(handleBufferFlush);
        };
    }, []);

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
            {/* ALERT MODAL (Highest Z-Index) */}
            <GlobalAlertModal 
                alert={currentAlert} 
                onClose={() => setCurrentAlert(null)} 
            />

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