// src/components/TodayReport.jsx
import React, { useState, useEffect } from 'react';
import { FaExclamationTriangle, FaCheckCircle, FaChartBar, FaCalendarAlt, FaDownload, FaFileAlt } from 'react-icons/fa';

/**
 * Renders the Today's Incident Log, Activity Summary, and Log Downloader sidebar.
 * It receives 'incidents' (real-time data) and 'user' (for the token) as props.
 */
export default function TodayReport({ incidents, alerts = [], user }) {
    
    // --- STATE: Activity Summary (Alerts) ---
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    // --- STATE: Log Downloader (New) ---
    // Default to today's date in YYYY-MM-DD format
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);

    // CONFIGURATION: Replace with your Raspberry Pi's IP Address and the backend port (from picam.py)
    const RPI_BASE_URL = "http://192.168.2.106:4050"; 


    // --- Data / Activity Summary ---
    // The Activity Summary panel now shows recent alerts from the last 24h.
    useEffect(() => {
        setIsLoading(false);
        setError(null);
    }, [alerts]);

    
    // --- Determine System Status (using alerts) ---
    const incidentCount = alerts?.length || 0;
    const isClear = incidentCount === 0;

    // --- HELPER: Date Formatter ---
    const formatDateDisplay = (dateString) => {
        const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
        return new Date(dateString).toLocaleDateString(undefined, options);
    };

    const groupedAlerts = React.useMemo(() => {
        const map = {};
        (alerts || []).forEach((alert) => {
            const type = (alert.type || alert.event_class || alert.event_type || 'Unknown').toUpperCase();
            const ts = alert.ts || (alert.timestamp ? new Date(alert.timestamp).getTime() : Date.now());
            const snapshotUrl = alert.snapshot_url || alert.snapshotUrl || null;

            if (!map[type]) map[type] = { count: 0, times: [], latestSnapshot: null, latestTs: 0 };
            map[type].count += 1;
            map[type].times.push(ts);

            if (snapshotUrl && ts > map[type].latestTs) {
                map[type].latestTs = ts;
                map[type].latestSnapshot = snapshotUrl;
            }
        });

        Object.values(map).forEach((group) => {
            group.times.sort((a, b) => b - a);
            group.times = group.times.slice(0, 5);
        });

        return map;
    }, [alerts]);

    return (
        <div className="space-y-4 sticky top-2 h-fit">

            {/* 1. REAL-TIME INCIDENT LOG (WebSocket Data) */}
            <div className="bg-white p-4 rounded-xl shadow-lg border border-gray-200">
                <h3 className="text-xl font-bold text-gray-800 mb-4 border-b pb-2">Today's Incident Log</h3>

                {isClear ? (
                    <div className="p-4 bg-green-50 border border-green-300 text-green-700 rounded-lg flex items-center">
                        <FaCheckCircle className="mr-3 text-xl" />
                        <p className="font-semibold">All systems clear! No incidents recorded today. 🎉</p>
                    </div>
                ) : (
                    <div className="space-y-4 max-h-80 overflow-y-auto pr-2">
                        {Object.entries(groupedAlerts).map(([type, group]) => (
                            <div key={type} className="p-3 bg-red-50 border border-red-200 rounded-lg">
                                <div className="flex items-center justify-between gap-3">
                                    <div className="flex items-center gap-2">
                                        <FaExclamationTriangle className="text-red-600" />
                                        <span className="font-bold text-base text-red-700">{type}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className="text-xs text-gray-500">{group.count}x</span>
                                        {group.latestSnapshot && (
                                            <a
                                                href={group.latestSnapshot}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="text-xs font-semibold text-teal-700 bg-teal-100 hover:bg-teal-200 px-2 py-1 rounded-full"
                                            >
                                                View Snapshot
                                            </a>
                                        )}
                                    </div>
                                </div>
                                <div className="mt-2 grid grid-cols-2 gap-2 text-xs text-gray-600">
                                    {group.times.map((ts) => (
                                        <span key={ts}>@ {new Date(ts).toLocaleTimeString()}</span>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* 2. ACTIVITY SUMMARY (API Data) */}
            <div className="bg-white p-4 rounded-xl shadow-lg border border-gray-200">
                <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center border-b pb-2">
                    <FaChartBar className="mr-2 text-teal-600" />
                    Activity Summary (24h)
                </h3>

                {isLoading && <p className="text-center text-gray-500">Loading summary...</p>}
                {error && <p className="text-center text-red-500 font-medium">{error}</p>}

                {!isLoading && !error && (!alerts || alerts.length === 0) && (
                    <p className="text-center text-gray-500">No alerts detected in the last 24 hours.</p>
                )}

                {!isLoading && !error && alerts && alerts.length > 0 && (
                    <div className="space-y-2 max-h-52 overflow-y-auto pr-2">
                        {alerts
                            .slice()
                            .sort((a, b) => b.ts - a.ts)
                            .slice(0, 10)
                            .map((alert, idx) => (
                                <div key={idx} className="flex items-center justify-between bg-gray-50 border border-gray-100 rounded-lg px-3 py-2">
                                    <span className="text-sm font-semibold text-gray-700">
                                        {alert.type?.toUpperCase() || 'ALERT'}
                                    </span>
                                    <span className="text-xs text-gray-500">
                                        @{new Date(alert.ts).toLocaleTimeString()}
                                    </span>
                                </div>
                            ))}
                    </div>
                )}
                <p className="text-xs text-gray-500 mt-4 text-center">Showing the most recent 10 alerts from the last 24 hours.</p>
            </div>

            {/* 3. LOG PANEL / EXPORT LOGS (New Feature) */}
            <div className="bg-white p-4 rounded-xl shadow-lg border border-gray-200">
                <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center border-b pb-2">
                    <FaFileAlt className="mr-2 text-blue-600" />
                    Export Daily Logs
                </h3>

                <div className="space-y-4">
                    {/* Date Selection */}
                    <div>
                        <label className="text-xs text-gray-500 mb-1 block font-bold">SELECT DATE</label>
                        <input
                            type="date"
                            value={selectedDate}
                            onChange={(e) => setSelectedDate(e.target.value)}
                            className="bg-gray-50 border border-gray-300 rounded-md text-gray-800 px-4 py-2 
                                     focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 
                                     transition-all w-full cursor-pointer"
                        />
                        <p className="mt-1 text-xs text-blue-600 font-medium text-right">
                            {formatDateDisplay(selectedDate)}
                        </p>
                    </div>

                    {/* Download Button */}
                    <div>
                        <label className="text-xs text-gray-500 mb-1 block font-bold">ACTION</label>
                        <a
                            // Link points to the Flask backend route we updated in picam.py
                            href={`${RPI_BASE_URL}/download_log?date=${selectedDate}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 text-white 
                                     font-semibold py-2 px-4 rounded-md shadow hover:shadow-lg transform hover:-translate-y-0.5 
                                     transition-all duration-200 w-full"
                        >
                            <FaDownload className="text-sm" />
                            <span>Download Log File</span>
                        </a>
                        <p className="text-xs text-gray-400 mt-2 text-center">
                            Downloads a .txt file of all events.
                        </p>
                    </div>

                    {/* Note to the User */}
                    <div className="p-3 bg-blue-50 border border-blue-200 rounded-md text-xs text-blue-800">
                        <strong>Note:</strong> Logs are only available if the monitoring system was active on the selected date. 
                        If you receive a "No logs found" error, no activity was recorded for that day.
                    </div>
                </div>
            </div>
        </div>
    );
}