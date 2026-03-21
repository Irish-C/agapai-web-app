// src/components/TodayReport.jsx
import React, { useState, useEffect } from 'react';
import { FaExclamationTriangle, FaCheckCircle, FaChartBar, FaCalendarAlt, FaDownload, FaFileAlt, FaSpinner } from 'react-icons/fa';

/**
 * Renders the Today's Incident Log, Activity Summary, and Log Downloader sidebar.
 * It receives 'incidents' (real-time data) and 'user' (for the token) as props.
 */
export default function TodayReport({ incidents, alerts = [], user }) {
    
    // --- STATE: Activity Summary (Alerts) ---
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isExporting, setIsExporting] = useState(false);
    const [exportError, setExportError] = useState(null);
    const [loadingDownloadDate, setLoadingDownloadDate] = useState(false);
    const [downloadDateIncidents, setDownloadDateIncidents] = useState([]);

    // --- STATE: Log Downloader (New) ---
    // Default to today's date in YYYY-MM-DD format for downloading from any date
    const [downloadDate, setDownloadDate] = useState(new Date().toISOString().split('T')[0]);
    
    // Today's date (fixed, always today)
    const todayDate = new Date().toISOString().split('T')[0]; 


    // --- Data / Activity Summary ---
    // The Activity Summary panel now shows recent alerts from the last 24h.
    useEffect(() => {
        setIsLoading(false);
        setError(null);
    }, [alerts]);

    // Fetch incidents for selected download date from database
    useEffect(() => {
        const fetchIncidentsForDownloadDate = async () => {
            setLoadingDownloadDate(true);
            try {
                const response = await fetch(`/api/logs/export?date=${downloadDate}`);
                if (!response.ok) {
                    setDownloadDateIncidents([]);
                    return;
                }
                const data = await response.json();
                if (data.status === 'success' && data.events) {
                    setDownloadDateIncidents(data.events);
                } else {
                    setDownloadDateIncidents([]);
                }
            } catch (err) {
                console.error('Failed to fetch incidents for download date:', err);
                setDownloadDateIncidents([]);
            } finally {
                setLoadingDownloadDate(false);
            }
        };
        
        fetchIncidentsForDownloadDate();
    }, [downloadDate]);

    
    // --- Determine System Status (using alerts) ---
    const incidentCount = alerts?.length || 0;
    const isClear = incidentCount === 0;

    // --- HELPER: Date Formatter ---
    const formatDateDisplay = (dateString) => {
        const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
        return new Date(dateString).toLocaleDateString(undefined, options);
    };

    // Download logs from API
    const handleDownloadLogs = async () => {
        setIsExporting(true);
        setExportError(null);
        
        try {
            const response = await fetch(`/api/logs/export?date=${downloadDate}`);
            
            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.message || 'Failed to export logs');
            }
            
            const data = await response.json();
            
            if (data.status !== 'success') {
                throw new Error(data.message || 'Failed to export logs');
            }
            
            // Create a blob and download
            const blob = new Blob([JSON.stringify(data, null, 2)], {
                type: 'application/json',
            });
            const url = URL.createObjectURL(blob);
            const anchor = document.createElement('a');
            anchor.href = url;
            anchor.download = `incident-logs-${downloadDate}.json`;
            document.body.appendChild(anchor);
            anchor.click();
            anchor.remove();
            URL.revokeObjectURL(url);
            
        } catch (err) {
            console.error('Failed to download logs:', err);
            setExportError(err.message || 'Unable to download logs. Please try again.');
        } finally {
            setIsExporting(false);
        }
    };

    const groupedAlerts = React.useMemo(() => {
        const map = {};
        (alerts || []).forEach((alert) => {
            // Use standard fields from unified data contract
            const type = (alert.type || 'Unknown').toUpperCase();
            const ts = alert.ts || Date.now();
            const snapshotUrl = alert.snapshot_url || null;

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

            {/* 1. TODAY'S INCIDENT LOG (Real-time, always TODAY) */}
            <div className="bg-white p-4 rounded-xl shadow-lg border border-gray-200">
                <h3 className="text-lg font-bold text-gray-800 mb-4 border-b pb-2">
                    📅 Today is {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                </h3>

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
                                                View
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

            {/* 3. DOWNLOAD INCIDENT LOGS (Separate date picker) */}
            <div className="bg-white p-4 rounded-xl shadow-lg border border-gray-200">
                <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center border-b pb-2">
                    <FaFileAlt className="mr-2 text-blue-600" />
                    Download Incident Logs
                </h3>

                <div className="space-y-4">
                    {/* Date Selection for Download */}
                    <div>
                        <label className="text-xs text-gray-500 mb-2 block font-bold">SELECT DATE</label>
                        <input
                            type="date"
                            value={downloadDate}
                            onChange={(e) => setDownloadDate(e.target.value)}
                            className="bg-gray-50 border border-gray-300 rounded-md text-gray-800 px-4 py-2 
                                     focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 
                                     transition-all w-full cursor-pointer"
                        />
                        <p className="mt-1 text-xs text-blue-600 font-medium text-right">
                            {formatDateDisplay(downloadDate)}
                        </p>
                    </div>

                    {/* Preview of incidents for selected date */}
                    {loadingDownloadDate ? (
                        <div className="p-3 text-center text-gray-500 text-sm">
                            <FaSpinner className="animate-spin inline-block mr-2" /> Loading incidents...
                        </div>
                    ) : downloadDateIncidents.length === 0 ? (
                        <div className="p-3 bg-yellow-50 border border-yellow-200 text-yellow-700 rounded-lg text-sm">
                            No incidents recorded for {formatDateDisplay(downloadDate)}.
                        </div>
                    ) : (
                        <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                            <p className="text-xs font-semibold text-blue-700 mb-2">
                                📋 {downloadDateIncidents.length} incident{downloadDateIncidents.length !== 1 ? 's' : ''} found
                            </p>
                            <div className="space-y-2 max-h-40 overflow-y-auto">
                                {downloadDateIncidents.map((incident) => (
                                    <div key={incident.id} className="text-xs bg-blue-100 border border-blue-300 rounded p-2">
                                        <span className="font-semibold text-blue-900">{incident.type}</span>
                                        <span className="text-blue-700"> @ {new Date(incident.timestamp).toLocaleTimeString()}</span>
                                        <br />
                                        <span className="text-blue-600">📍 {incident.location}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Download Button */}
                    <button
                        onClick={handleDownloadLogs}
                        disabled={isExporting || downloadDateIncidents.length === 0}
                        className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 disabled:bg-gray-400 text-white 
                                 font-semibold py-2 px-4 rounded-md shadow hover:shadow-lg transform hover:-translate-y-0.5 
                                 transition-all duration-200 w-full disabled:cursor-not-allowed"
                    >
                        {isExporting ? (
                            <>
                                <FaSpinner className="animate-spin text-sm" />
                                <span>Exporting...</span>
                            </>
                        ) : (
                            <>
                                <FaDownload className="text-sm" />
                                <span>Download {downloadDateIncidents.length > 0 ? `(${downloadDateIncidents.length})` : '(No incidents)'}</span>
                            </>
                        )}
                    </button>
                    {exportError && (
                        <p className="text-xs text-red-600 mt-2 text-center font-semibold">{exportError}</p>
                    )}
                    <p className="text-xs text-gray-400 text-center">
                        Downloads a JSON file of all incidents for {formatDateDisplay(downloadDate)}.
                    </p>
                </div>
            </div>
        </div>
    );
}