// src/components/CameraNotificationSettings.jsx
import React, { useState, useEffect } from 'react';
import { FaBell, FaVideo } from 'react-icons/fa';

// ============================================================================
// CONSTANTS & CONFIGURATION
// ============================================================================

// API endpoint for global settings
const API_ENDPOINT = '/api/settings/notifications/global';

// Default values for all settings
const SETTINGS_DEFAULTS = {
    emit_fall: true,
    persist_fall: true,
    emit_inactivity: false,
    persist_inactivity: false,
    ai_enabled: true,
    email_fallback: true,
};

// Notification sections configuration - easily extensible for new alert types
const NOTIFICATION_SECTIONS = [
    {
        id: 'fall',
        icon: '🎯',
        title: 'Fall Detection Alerts',
        toggles: [
            {
                label: 'Real-time Alerts (WebSocket)',
                description: 'Send immediate popup notifications when a fall is detected',
                settingKey: 'emit_fall',
                colorClass: 'peer-checked:bg-teal-600',
            },
            {
                label: 'Save to History (Database)',
                description: 'Record fall events with snapshots in Reports for later review',
                settingKey: 'persist_fall',
                colorClass: 'peer-checked:bg-teal-600',
            },
        ],
    },
    {
        id: 'inactivity',
        icon: '⏱️',
        title: 'Inactivity Detection Alerts',
        subtitle: 'Triggered when no person detected for 20+ seconds',
        toggles: [
            {
                label: 'Real-time Alerts (WebSocket)',
                description: 'Send immediate notification when inactivity is detected',
                settingKey: 'emit_inactivity',
                colorClass: 'peer-checked:bg-teal-600',
            },
            {
                label: 'Save to History (Database)',
                description: 'Record inactivity events in Reports for later review',
                settingKey: 'persist_inactivity',
                colorClass: 'peer-checked:bg-teal-600',
            },
        ],
    },
];

// ============================================================================
// REUSABLE COMPONENTS
// ============================================================================

/**
 * SettingToggle: Unified toggle component with smooth animations
 * Features: focus ring, hover effects, color customization, accessibility
 */
const SettingToggle = ({ label, description, checked, onToggle, colorClass }) => (
    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-75 transition-colors">
        <div className="flex-1">
            <p className="text-gray-700 font-medium">{label}</p>
            <p className="text-xs text-gray-500 mt-1">{description}</p>
        </div>
        <label className="relative inline-flex items-center cursor-pointer ml-4">
            <input
                type="checkbox"
                checked={checked}
                onChange={(e) => onToggle(e.target.checked)}
                className="sr-only peer"
                aria-label={label}
            />
            <div
                className={`w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 hover:ring-4 hover:ring-blue-300/40 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all ${colorClass}`}
            />
        </label>
    </div>
);

/**
 * SettingsSection: Renders a section of related notification settings
 * Reduces repetition for fall/inactivity sections
 */
const SettingsSection = ({ section, globalSettings, onToggle }) => (
    <div className="mt-6 pt-4 border-t">
        <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center">
            <span className="text-lg mr-2">{section.icon}</span>
            {section.title}
        </h3>
        {section.subtitle && (
            <p className="text-xs text-gray-600 mb-3">{section.subtitle}</p>
        )}
        <div className="space-y-3 ml-1">
            {section.toggles.map((toggle) => (
                <SettingToggle
                    key={toggle.settingKey}
                    label={toggle.label}
                    description={toggle.description}
                    checked={globalSettings[toggle.settingKey]}
                    onToggle={(v) => onToggle({ [toggle.settingKey]: v })}
                    colorClass={toggle.colorClass}
                />
            ))}
        </div>
    </div>
);

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function CameraNotificationSettings() {
    const [globalSettings, setGlobalSettings] = useState(SETTINGS_DEFAULTS);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);

    // Fetch global settings from backend on component mount
    useEffect(() => {
        const fetchSettings = async () => {
            setIsLoading(true);
            try {
                const res = await fetch(API_ENDPOINT);
                if (!res.ok) throw new Error('Failed to fetch settings');

                const data = await res.json();
                setGlobalSettings({
                    emit_fall: data.emit_fall === true,
                    persist_fall: data.persist_fall === true,
                    emit_inactivity: data.emit_inactivity === true,
                    persist_inactivity: data.persist_inactivity === true,
                    ai_enabled: data.ai_enabled === true,
                    email_fallback: data.email_fallback === true,
                });
                setError(null);
            } catch (err) {
                console.error('Failed to load global settings:', err);
                setError('Failed to load settings. Please refresh and try again.');
            } finally {
                setIsLoading(false);
            }
        };
        fetchSettings();
    }, []);

    // Save settings to backend with optimistic updates and error rollback
    const saveGlobalSettings = async (partial) => {
        const prevSettings = globalSettings;
        const updatedSettings = { ...globalSettings, ...partial };

        // Optimistic update
        setGlobalSettings(updatedSettings);

        try {
            const res = await fetch(API_ENDPOINT, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(updatedSettings),
            });

            if (!res.ok) throw new Error('Failed to save settings');
            setError(null);
        } catch (err) {
            console.error('Error saving global settings:', err);
            setError('Failed to save settings. Changes were reverted.');
            // Rollback on error
            setGlobalSettings(prevSettings);
        }
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center p-6">
                <p className="text-gray-500">Loading settings...</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* NOTIFICATION SETTINGS SECTION */}
            <div className="bg-white p-6 rounded-xl shadow-md border border-gray-100">
                <h2 className="text-xl font-semibold text-gray-800 flex items-center mb-4 border-b pb-2">
                    <FaBell className="mr-2 text-yellow-600" />
                    Global Notification & Alert Settings
                </h2>
                <p className="text-sm text-gray-500 mb-4">
                    Manage system-wide behavior for event detection and notification delivery methods.
                </p>

                {/* Error Display */}
                {error && (
                    <div className="mb-4 p-3 bg-red-50 border border-red-300 text-red-700 rounded-lg text-sm">
                        {error}
                    </div>
                )}

                <div className="space-y-4">
                    {/* Email Fallback Toggle */}
                    <SettingToggle
                        label="Email Notification Fallback"
                        description="Send email notifications if real-time WebSocket alerts fail"
                        checked={globalSettings.email_fallback}
                        onToggle={(v) => saveGlobalSettings({ email_fallback: v })}
                        colorClass="peer-checked:bg-teal-600"
                    />

                    {/* Dynamic Notification Sections */}
                    {NOTIFICATION_SECTIONS.map((section) => (
                        <SettingsSection
                            key={section.id}
                            section={section}
                            globalSettings={globalSettings}
                            onToggle={saveGlobalSettings}
                        />
                    ))}
                </div>
            </div>

            {/* AI DETECTION SECTION */}
            <div className="bg-white p-6 rounded-xl shadow-md border border-gray-100">
                <h2 className="text-xl font-semibold text-gray-800 flex items-center mb-4 border-b pb-2">
                    <FaVideo className="mr-2 text-teal-600" />
                    AI Detection & Camera Activation
                </h2>
                <p className="text-sm text-gray-500 mb-4">
                    Control AI inference and detection models for all cameras.
                </p>

                <div className="space-y-3">
                    {/* AI Detection Toggle */}
                    <SettingToggle
                        label="Enable AI Detection (YOLO)"
                        description={
                            globalSettings.ai_enabled
                                ? '✓ AI is ACTIVE - runs YOLO inference every 6 frames'
                                : '✗ AI is DISABLED - no YOLO processing, raw video only'
                        }
                        checked={globalSettings.ai_enabled}
                        onToggle={(v) => saveGlobalSettings({ ai_enabled: v })}
                        colorClass="peer-checked:bg-teal-600"
                    />

                    {/* Placeholder for Per-Camera Settings */}
                    <div className="p-4 bg-blue-50 border border-blue-300 text-blue-800 rounded-lg text-sm mt-4">
                        ℹ️ Per-camera model activation controls will be implemented here.
                    </div>
                </div>
            </div>
        </div>
    );
}