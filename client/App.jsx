import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';

//image
import agapai_Bg from './src/assets/bg/gray-bg.png';

// services
import { loginUser, fetchCameraList, logoutUser } from './src/services/apiService.js';
import { socket } from './src/services/socket.js';

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
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black bg-opacity-80 animate-pulse">
            <div className="bg-white border-8 border-red-600 rounded-2xl shadow-2xl p-10 max-w-xl w-full text-center transform scale-110">
                <div className="text-8xl mb-4 animate-bounce">🚨</div>
                <h2 className="text-4xl font-black text-red-700 mb-2">FALL DETECTED!</h2>
                
                <p className="text-2xl text-gray-900 mb-6">
                    Location: <span className="font-bold underline">{alert.location || 'Unknown Area'}</span>
                </p>

                <div className="bg-red-100 border-l-8 border-red-600 text-red-700 px-6 py-4 rounded-lg mb-6 text-left">
                    <p className="font-bold text-xl mb-1">Status: Hardware Alarm Active</p>
                    <p className="text-lg">Check the patient immediately! Provide medical assistance if necessary.</p>
                </div>

                <p className="text-md text-gray-600 mb-8 italic">
                    The physical alarm on the device is currently sounding.
                </p>

                <button 
                    onClick={onClose}
                    className="bg-red-600 hover:bg-red-800 text-white font-bold py-4 px-8 rounded-xl text-xl w-full transition-colors shadow-lg"
                >
                    Dismiss Notification
                </button>
            </div>
        </div>
    );
};

export default function App() {
    // Authentication state
    const [user, setUser] = useState(() => {
        const storedUser = localStorage.getItem('user');
        const parsed = storedUser ? JSON.parse(storedUser) : null;

        // Ensure auth token is available for API requests (in case localStorage was cleared separately)
        if (parsed?.token && !localStorage.getItem('authToken')) {
            localStorage.setItem('authToken', parsed.token);
        }

        // Normalize stored role values to lowercase (handles legacy stored data)
        if (parsed) {
            parsed.role = normalizeRole(parsed.role);
        }
        return parsed;
    });

    const [cameras, setCameras] = useState([]);
    const [currentAlert, setCurrentAlert] = useState(null);

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

        socket.on('new_alert', handleAlert);
        socket.on('alert_acknowledged', handleAck);

        return () => {
            socket.off('new_alert', handleAlert);
            socket.off('alert_acknowledged', handleAck);
        };
    }, []);

    // --- API LOGIC ---
    const login = async (username, password) => {
        try {
            const data = await loginUser(username, password);
            if (data.status === 'success' || data.token) {
                const userData = {
                    username: data.username,
                    role: normalizeRole(data.role),
                    userId: data.user_id,
                    token: data.access_token || data.token
                };
                setUser(userData);
                localStorage.setItem('user', JSON.stringify(userData));
                return { success: true };
            }
            return { success: false, message: data.message || 'Login failed.' };
        } catch (error) {
            console.error('Login API error:', error);
            return { success: false, message: 'Server connection error.' };
        }
    };

    const logout = () => {
        logoutUser();
        setUser(null);
        localStorage.removeItem('user');
    };

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
        <div className="flex flex-col min-h-screen relative font-sans">
            {/* ALERT MODAL (Highest Z-Index) */}
            <GlobalAlertModal 
                alert={currentAlert} 
                onClose={() => setCurrentAlert(null)} 
            />

            <ConnectionStatus onLogout={logout} />

            {user && <Header user={user} logout={logout} />}

            <main
                className="flex-grow min-h-screen bg-cover bg-center bg-no-repeat bg-fixed"
                style={{ backgroundImage: `url(${agapai_Bg})` }}
            >
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

                    {/* Fallbacks */}
                    <Route path="*" element={<Navigate to={user ? "/dashboard" : "/"} replace />} />
                </Routes>
            </main>

            {user && <Footer />}
        </div>
    );
}