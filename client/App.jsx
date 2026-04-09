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
    // alert ={ priority: "CRITICAL", type: "Fall_Detected", location: "Living Room", timestamp: new Date().toISOString(), snapshot_url: "https://via.placeholder.com/400x300.png?text=Alert+Snapshot" };

    // Determine styling based on priority and class type
    const getPriorityStyles = (priority, type) => {
        if (type?.includes("Fall")) {
            return {
                bg: "bg-red-600",
                ring: "ring-red-600/60",
                text: "text-red-700",
                border: "border-red-600",
                badge: "bg-red-100 text-red-800",
                icon: "🚨"
            };
        }
        
        if (priority === "CRITICAL") {
            return {
                bg: "bg-red-600",
                ring: "ring-red-600/60",
                text: "text-red-700",
                border: "border-red-600",
                badge: "bg-red-100 text-red-800",
                icon: "🚨"
            };
        }
        
        if (priority === "HIGH") {
            return {
                bg: "bg-orange-600",
                ring: "ring-orange-600/60",
                text: "text-orange-700",
                border: "border-orange-600",
                badge: "bg-orange-100 text-orange-800",
                icon: "⚠️"
            };
        }
        
        if (priority === "MEDIUM") {
            return {
                bg: "bg-yellow-600",
                ring: "ring-yellow-600/60",
                text: "text-yellow-700",
                border: "border-yellow-600",
                badge: "bg-yellow-100 text-yellow-800",
                icon: "⚡"
            };
        }
        
        // LOW priority or default
        return {
            bg: "bg-blue-600",
            ring: "ring-blue-600/60",
            text: "text-blue-700",
            border: "border-blue-600",
            badge: "bg-blue-100 text-blue-800",
            icon: "ℹ️"
        };
    };

    const styles = getPriorityStyles(alert.priority, alert.type);

    // Format timestamp
    const formatTime = (isoString) => {
        try {
            const date = new Date(isoString);
            return date.toLocaleTimeString() + " " + date.toLocaleDateString();
        } catch {
            return "Unknown time";
        }
    };

    // Determine alert message based on type and priority
    const getAlertMessage = () => {
        if (alert.type?.includes("Fall")) {
            return "A fall has been detected! Check immediately.";
        }
        if (alert.priority === "HIGH" && alert.type?.includes("Inactivity")) {
            return "Person has been inactive for 30+ minutes.";
        }
        if (alert.priority === "MEDIUM" && alert.type?.includes("Inactivity")) {
            return "Person has been inactive for 15+ minutes.";
        }
        if (alert.priority === "LOW" && alert.type?.includes("Inactivity")) {
            return "Person has been inactive for 5+ minutes.";
        }
        return "An alert has been triggered.";
    };

    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 p-4">
            
            <div className={`${styles.bg} rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 shadow-[0_0_60px_rgba(239,68,68,0.5)] ring-2 ${styles.ring}`}>
                
                {/* Top Alert Bar */}
                <div className={`${styles.bg} text-white py-3 px-4 flex items-center justify-between gap-2`}>
                    <span className="text-lg font-bold tracking-wide flex items-center gap-2">
                        {styles.icon} ALERT
                    </span>
                    <span className={`text-xs font-semibold px-2 py-1 rounded-full ${styles.badge}`}>
                        {alert.priority || "INFO"}
                    </span>
                </div>

                <div className="p-6">

                    {/* Title */}
                    <h2 className={`text-2xl font-bold ${styles.text} mb-2`}>
                        {alert.type ? alert.type.replace('_', ' ').toUpperCase() : "ALERT"}
                    </h2>

                    {/* Location */}
                    <p className="text-sm text-gray-700 mb-2">
                        <span className="font-semibold">Location:</span> {alert.location || "Unknown"}
                    </p>

                    {/* Timestamp */}
                    <p className="text-xs text-gray-500 mb-4">
                        {formatTime(alert.timestamp)}
                    </p>

                    {/* Snapshot */}
                    {alert.snapshot_url && (
                        <div className="mb-4">
                            <img
                                src={alert.snapshot_url}
                                alt="Alert snapshot"
                                onError={(e) => {
                                    console.warn("Failed to load snapshot:", alert.snapshot_url);
                                    e.target.style.display = 'none';
                                }}
                                className="w-full max-w-xs mx-auto rounded-lg border-2 border-gray-300 shadow-md"
                            />
                        </div>
                    )}

                    {/* Alert Details */}
                    <div className={`${styles.badge} rounded-lg p-3 mb-4 text-sm`}>
                        {getAlertMessage()}
                    </div>

                    {/* Warning Text */}
                    <p className={`text-sm font-medium mb-5 ${alert.type?.includes("Fall") ? 'text-red-600' : 'text-gray-600'}`}>
                        {alert.type?.includes("Fall") ? "🔔 Emergency alarm is sounding!" : alert.priority === "HIGH" ? "⚠️ Hardware alarm may be sounding." : ""}
                    </p>

                    {/* Button */}
                    <button
                        onClick={onClose}
                        className={`w-full ${styles.bg} hover:opacity-90 text-white font-semibold py-2.5 rounded-xl transition-all duration-200 shadow-md hover:shadow-lg active:scale-95`}
                    >
                        ACKNOWLEDGE
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

    // Handle alert acknowledgement
    const handleAlertClose = async () => {
        if (!currentAlert) return;
        
        try {
            // Emit acknowledgement via Socket.IO
            socket.emit('ack_alert', {
                alert_id: currentAlert.id,
                user_id: user?.userId,
                timestamp: new Date().toISOString()
            });
            
            console.log('[Alert] Sent acknowledgement for alert:', currentAlert.id);
        } catch (err) {
            console.error('[Alert] Failed to emit ack_alert:', err);
        }
        
        // Also make REST call for redundancy
        if (currentAlert.id) {
            try {
                await fetch(`http://127.0.0.1:5000/api/alerts/${currentAlert.id}/acknowledge`, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                });
                console.log('[Alert] REST acknowledgement sent');
            } catch (err) {
                console.warn('[Alert] REST acknowledgement failed:', err);
            }
        }
        
        // Clear from UI
        setCurrentAlert(null);
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
                onClose={handleAlertClose} 
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