import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from './src/components/AuthContext.jsx';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';

//image
import agapai_Bg from './src/assets/bg/gray-bg.png';

// services
import { loginUser, logoutUser } from './src/services/apiService.js';
import { socket } from './src/services/socket.js';

// helpers
import { normalizeRole } from './src/utils/roleUtils.js';

// components
import Header from './src/components/layout/Header.jsx';
import Footer from './src/components/layout/Footer.jsx';
import ConnectionStatus from "./src/components/ConnectionStatus.jsx";
import RealTimeAlertModal from './src/features/modal/RealTimeAlertModal.jsx';

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

    const [alertIncident, setAlertIncident] = useState(null);

    // Listen for real-time alerts from backend
    useEffect(() => {
        const handleAlert = (data) => {
            console.log('[App] Received alert:', data);
            
            // Format incident data for the modal
            const incident = {
                alert_id: data.id,  // Database ID for acknowledgment
                type: data.type || 'Unknown Alert',
                location: data.location || 'Unknown Location',
                timestamp: data.timestamp ? new Date(data.timestamp).getTime() / 1000 : Math.floor(Date.now() / 1000),
                snapshot_url: data.snapshot_url,
                camera_id: data.camera_id
            };
            
            console.log('[App] Incident object:', incident);
            setAlertIncident(incident);
        };

        // Show modal for both NEW alerts and ACCUMULATED alerts (smart gap detection resets on 30s+ gap)
        socket.on('new_alert', handleAlert);
        socket.on('alert_accumulated', handleAlert);

        return () => {
            socket.off('new_alert', handleAlert);
            socket.off('alert_accumulated', handleAlert);
        };
    }, []);

    const handleDismissAlert = () => {
        console.log('[App] Alert modal dismissed (not acknowledged)');
        setAlertIncident(null);
        // Modal is closed but alert remains unacknowledged in database
    };

    const handleAcknowledgeAlert = () => {
        console.log('[App] Alert acknowledged explicitly');
        setAlertIncident(null);
        
        // Send acknowledgment back to backend with correct format
        if (alertIncident && user && token) {
            socket.emit('ack_alert', {
                alert_id: alertIncident.alert_id,
                user_id: user.id,
                token: token
            });
            console.log('[App] Sent ack_alert with alert_id:', alertIncident.alert_id);
        }
    };

    // Track location and save to localStorage
    useEffect(() => {
        if (location.pathname !== '/login' && location.pathname !== '/') {
            localStorage.setItem('lastPage', location.pathname);
        }
    }, [location]);

    const authProps = { user, logout };

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

            {/* Global Real-Time Alert Modal - shows on all pages */}
            <RealTimeAlertModal 
                incident={alertIncident} 
                onDismiss={handleDismissAlert}
            />

            {user && <Footer />}
        </div>
    );
}