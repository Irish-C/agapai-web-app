// src/components/CameraNotificationSettings.jsx
import React, { useState, useEffect } from 'react';
import { FaBell, FaToggleOn, FaEnvelope, FaVideo } from 'react-icons/fa';

export default function CameraNotificationSettings() {
    // Parent-level state for global settings
    const [globalSettings, setGlobalSettings] = useState({
        emit_fall: true,
        persist_fall: true,
        emit_inactivity: false,
        persist_inactivity: false,
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

    // Reusable ToggleRow component controlled by parent state
    const ToggleRow = ({ icon, label, checked, onToggle }) => {
        return (
            <div className="flex items-center justify-between p-3 bg-white border border-gray-50 rounded-lg">
                <label className="text-gray-700 font-medium flex items-center">
                    {icon}
                    <span className="ml-0">{label}</span>
                </label>
                <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" checked={checked} onChange={(e) => onToggle(e.target.checked)} className="sr-only peer" />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 peer-focus:ring-offset-2 peer-focus:ring-opacity-75 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-teal-600"></div>
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
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <label className="text-gray-700 font-medium flex items-center">
                            <FaToggleOn className="mr-3 text-2xl text-green-500" />
                            Enable Real-time Incident Alerts (WebSocket)
                        </label>
                        <span className="text-sm text-teal-600 font-semibold">Enabled</span>
                    </div>

                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <label className="text-gray-700 font-medium flex items-center">
                            <FaEnvelope className="mr-3 text-xl text-blue-500" />
                            Email Notification Fallback
                        </label>
                        <label className="relative inline-flex items-center cursor-pointer">
                            <input type="checkbox" value="" className="sr-only peer" defaultChecked />
                            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 peer-focus:ring-offset-2 peer-focus:ring-opacity-75 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-teal-600"></div>
                        </label>
                    </div>

                    {/* Per-event notification toggles (moved here) */}
                    <div className="space-y-2 mt-3">
                        <ToggleRow icon={null} label="Emit Fall Alerts" checked={globalSettings.emit_fall} onToggle={(v) => saveGlobalSettings({ emit_fall: v })} />
                        <ToggleRow icon={null} label="Persist Fall Events" checked={globalSettings.persist_fall} onToggle={(v) => saveGlobalSettings({ persist_fall: v })} />
                        <ToggleRow icon={null} label="Emit Inactivity Alerts" checked={globalSettings.emit_inactivity} onToggle={(v) => saveGlobalSettings({ emit_inactivity: v })} />
                        <ToggleRow icon={null} label="Persist Inactivity Events" checked={globalSettings.persist_inactivity} onToggle={(v) => saveGlobalSettings({ persist_inactivity: v })} />
                    </div>
                </div>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-md border border-gray-100">
                <h2 className="text-xl font-semibold text-gray-800 flex items-center mb-4 border-b pb-2">
                    <FaVideo className="mr-2 text-teal-600" />
                    Camera Activation Management
                </h2>
                <p className="text-sm text-gray-500 mb-4">
                    Control which detection models (Fall, Inactivity) are active for each camera location.
                </p>
                
                {/* Placeholder for Camera Activation Grid */}
                <div className="p-4 bg-yellow-50 border border-yellow-300 text-yellow-800 rounded-lg text-sm">
                    ⚠️ Model activation controls will be implemented here using a table structure.
                </div>
            </div>
        </div>
    );
}