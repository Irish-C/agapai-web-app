// src/components/CameraNotificationSettings.jsx
import React, { useState, useEffect } from 'react';
import { FaBell, FaEnvelope, FaVideo } from 'react-icons/fa';

export default function CameraNotificationSettings() {
    // Parent-level state for global settings
    const [globalSettings, setGlobalSettings] = useState({
        emit_fall: true,
        persist_fall: true,
        emit_inactivity: false,
        persist_inactivity: false,
        ai_enabled: true,
    });

    useEffect(() => {
        // Fetch global settings from backend
        const fetchSettings = async () => {
            try {
                const res = await fetch('/api/settings/notifications/global');
                const data = await res.json();
                if (res.ok) {
                    setGlobalSettings({
                        emit_fall: data.emit_fall === true,
                        persist_fall: data.persist_fall === true,
                        emit_inactivity: data.emit_inactivity === true,
                        persist_inactivity: data.persist_inactivity === true,
                        ai_enabled: data.ai_enabled === true,
                    });
                }
            } catch (e) {
                console.error('Failed to load global settings', e);
            }
        };
        fetchSettings();
    }, []);

    const saveGlobalSettings = async (partial) => {
        try {
            const payload = { ...globalSettings, ...partial };
            const res = await fetch('/api/settings/notifications/global', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });
            if (res.ok) {
                setGlobalSettings(payload);
            } else {
                console.error('Failed to save global settings');
            }
        } catch (e) {
            console.error('Error saving global settings', e);
        }
    };

    // Unified toggle component with animation
    const SettingToggle = ({ label, description, checked, onToggle, colorClass }) => {
        return (
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-75 transition-colors">
                <div className="flex-1">
                    <p className="text-gray-700 font-medium">{label}</p>
                    <p className="text-xs text-gray-500 mt-1">{description}</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer ml-4">
                    <input type="checkbox" checked={checked} onChange={(e) => onToggle(e.target.checked)} className="sr-only peer" />
                    <div className={`w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-offset-2 peer-focus:ring-opacity-75 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all ${colorClass}`}></div>
                </label>
            </div>
        );
    };

    return (
        <div className="space-y-6">
            <div className="bg-white p-6 rounded-xl shadow-md border border-gray-100">
                <h2 className="text-xl font-semibold text-gray-800 flex items-center mb-4 border-b pb-2">
                    <FaBell className="mr-2 text-yellow-600" />
                    Global Notification & Alert Settings
                </h2>
                <p className="text-sm text-gray-500 mb-4">
                    Manage system-wide behavior for event detection and notification delivery methods.
                </p>

                <div className="space-y-4">
                    {/* Email Fallback */}
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <label className="text-gray-700 font-medium flex items-center">
                            <FaEnvelope className="mr-3 text-xl text-blue-500" />
                            Email Notification Fallback
                        </label>
                        <label className="relative inline-flex items-center cursor-pointer">
                            <input type="checkbox" defaultChecked className="sr-only peer" />
                            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 peer-focus:ring-offset-2 peer-focus:ring-opacity-75 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-teal-600"></div>
                        </label>
                    </div>

                    {/* Fall Detection Section */}
                    <div className="mt-6 pt-4 border-t">
                        <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center">
                            <span className="text-lg mr-2">🎯</span> Fall Detection Alerts
                        </h3>
                        <div className="space-y-3 ml-1">
                            <SettingToggle 
                                label="Real-time Alerts (WebSocket)" 
                                description="Send immediate popup notifications when a fall is detected"
                                checked={globalSettings.emit_fall}
                                onToggle={(v) => saveGlobalSettings({ emit_fall: v })}
                                colorClass="peer-checked:bg-orange-500"
                            />
                            <SettingToggle 
                                label="Save to History (Database)" 
                                description="Record fall events with snapshots in Reports for later review"
                                checked={globalSettings.persist_fall}
                                onToggle={(v) => saveGlobalSettings({ persist_fall: v })}
                                colorClass="peer-checked:bg-blue-500"
                            />
                        </div>
                    </div>

                    {/* Inactivity Detection Section */}
                    <div className="mt-6 pt-4 border-t">
                        <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center">
                            <span className="text-lg mr-2">⏱️</span> Inactivity Detection Alerts
                        </h3>
                        <p className="text-xs text-gray-600 mb-3">Triggered when no person detected for 20+ seconds</p>
                        <div className="space-y-3 ml-1">
                            <SettingToggle 
                                label="Real-time Alerts (WebSocket)" 
                                description="Send immediate notification when inactivity is detected"
                                checked={globalSettings.emit_inactivity}
                                onToggle={(v) => saveGlobalSettings({ emit_inactivity: v })}
                                colorClass="peer-checked:bg-purple-500"
                            />
                            <SettingToggle 
                                label="Save to History (Database)" 
                                description="Record inactivity events in Reports for later review"
                                checked={globalSettings.persist_inactivity}
                                onToggle={(v) => saveGlobalSettings({ persist_inactivity: v })}
                                colorClass="peer-checked:bg-green-500"
                            />
                        </div>
                    </div>
                </div>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-md border border-gray-100">
                <h2 className="text-xl font-semibold text-gray-800 flex items-center mb-4 border-b pb-2">
                    <FaVideo className="mr-2 text-teal-600" />
                    AI Detection & Camera Activation
                </h2>
                <p className="text-sm text-gray-500 mb-4">
                    Control AI inference and detection models for all cameras.
                </p>
                
                {/* AI Detection Toggle */}
                <div className="space-y-3">
                    <SettingToggle 
                        label="Enable AI Detection (YOLO)" 
                        description={globalSettings.ai_enabled ? '✓ AI is ACTIVE - runs YOLO inference every 6 frames' : '✗ AI is DISABLED - no YOLO processing, raw video only'}
                        checked={globalSettings.ai_enabled}
                        onToggle={(v) => saveGlobalSettings({ ai_enabled: v })}
                        colorClass="peer-checked:bg-teal-600"
                    />
                    
                    {/* Placeholder for Per-Camera Settings */}
                    <div className="p-4 bg-blue-50 border border-blue-300 text-blue-800 rounded-lg text-sm mt-4">
                        Per-camera model activation controls will be implemented here.
                    </div>
                </div>
            </div>
        </div>
    );
}