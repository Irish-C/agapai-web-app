// src/components/TodayReport.jsx
import React, { useState, useMemo } from 'react';
import { FaExclamationTriangle, FaCheckCircle, FaDownload, FaFileAlt } from 'react-icons/fa';

/**
 * Renders the Today's Incident Log, Activity Summary, and Log Downloader sidebar.
 * It receives 'incidents' (real-time data) and 'user' (for the token) as props.
 */
export default function TodayReport({ incidents = [], alerts = [], user }) {
    
    // --- STATE ---
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);

    // --- STATE: Log Downloader (New) ---
    // Default to today's date in YYYY-MM-DD format
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);

    // CONFIGURATION: Replace with your Raspberry Pi's IP Address and the backend port (from picam.py)
    const RPI_BASE_URL = "http://192.168.2.106:4050"; 


    const incidentCount = incidents.length;
    const isClear = incidentCount === 0;

    // --- Helper: sorted incident list for display ---
    const sortedIncidents = useMemo(() => {
        const todayKey = new Date().toISOString().split('T')[0];

        return (incidents || [])
            .filter((inc) => {
                const ts = inc.ts || inc.timestamp || 0;
                if (!ts) return false;
                const dateKey = new Date(ts).toISOString().split('T')[0];
                return dateKey === todayKey;
            })
            .slice()
            .sort((a, b) => (b.ts || 0) - (a.ts || 0));
    }, [incidents]);

    const getIncidentType = (incident) => {
        return (incident.type || incident.event_class || incident.event_type || 'UNKNOWN').toUpperCase();
    };

    const getIncidentTimestamp = (incident) => {
        const ts = incident.ts || incident.timestamp || 0;
        return ts ? new Date(ts).toLocaleTimeString() : 'Unknown';
    };

    const getSnapshotUrl = (incident) => {
        return incident.snapshot_url || incident.snapshotUrl || incident.file_path || incident.filePath || null;
    };

    // --- HELPER: Date Formatter ---
    const formatDateDisplay = (dateString) => {
        const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
        return new Date(dateString).toLocaleDateString(undefined, options);
    };

    // --- ACTION: Download Incident Log (client-side export) ---
    const downloadIncidentLog = () => {
        setError(null);
        setIsLoading(true);

        try {
            const payload = {
                date: selectedDate,
                incidents: incidents || [],
            };

            const blob = new Blob([JSON.stringify(payload, null, 2)], {
                type: 'application/json',
            });
            const url = URL.createObjectURL(blob);
            const anchor = document.createElement('a');
            anchor.href = url;
            anchor.download = `incident-log-${selectedDate}.json`;
            document.body.appendChild(anchor);
            anchor.click();
            anchor.remove();
            URL.revokeObjectURL(url);
        } catch (err) {
            console.error('Failed to download incident log', err);
            setError('Unable to download incident log. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="space-y-4 sticky top-2 h-fit">

            {/* 1. REAL-TIME INCIDENT LOG (WebSocket Data) */}
            <div className="bg-white p-4 rounded-xl shadow-lg border border-gray-200">
                <h3 className="text-xl font-bold text-gray-800 mb-4 border-b pb-2">Today's Incident Log</h3>

                {isClear ? (
                    <div className="p-4 bg-green-50 border border-green-300 text-green-700 rounded-lg flex items-center">
                        <FaCheckCircle className="mr-3 text-xl" />
                        <p className="font-semibold">No incidents recorded today.</p>
                    </div>
                ) : (
                    <div className="space-y-2 max-h-96 overflow-y-auto pr-2">
                        {sortedIncidents.map((incident, idx) => {
                            const type = getIncidentType(incident);
                            const time = getIncidentTimestamp(incident);
                            const snapshotUrl = getSnapshotUrl(incident);
                            const location =
                                incident.location ||
                                incident.location_name ||
                                incident.loc_name ||
                                incident.camId ||
                                incident.camera_id ||
                                incident.cameraId ||
                                'Unknown Location';

                            return (
                                <div key={idx} className="p-3 bg-red-50 border border-red-200 rounded-lg">
                                    <div className="flex items-start justify-between gap-3">
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <FaExclamationTriangle className="text-red-600" />
                                                <span className="font-bold text-base text-red-700">{type}</span>
                                                <span className="text-xs text-gray-500">@ {time}</span>
                                            </div>
                                            <div className="text-xs text-gray-600 mt-1">
                                                {location}
                                            </div>
                                        </div>
                                        {snapshotUrl && (
                                            <a
                                                href={snapshotUrl}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="text-xs font-semibold text-teal-700 bg-teal-100 hover:bg-teal-200 px-2 py-1 rounded-full"
                                            >
                                                View Snapshot
                                            </a>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* 3. LOG PANEL / EXPORT LOGS (New Feature) */}
            <div className="bg-white p-4 rounded-xl shadow-lg border border-gray-200">
                <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center border-b pb-2">
                    <FaFileAlt className="mr-2 text-blue-600" />
                    Download Incident Log
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
                        <button
                            onClick={downloadIncidentLog}
                            disabled={isLoading}
                            className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 text-white 
                                     font-semibold py-2 px-4 rounded-md shadow hover:shadow-lg transform hover:-translate-y-0.5 
                                     transition-all duration-200 w-full disabled:cursor-not-allowed disabled:opacity-60"
                        >
                            <FaDownload className="text-sm" />
                            <span>Download Incident Log</span>
                        </button>
                        <p className="text-xs text-gray-400 mt-2 text-center">
                            Exports the current incident log as a JSON file.
                        </p>
                    </div>

                    {/* Note to the User */}
                    <div className="p-3 bg-blue-50 border border-blue-200 rounded-md text-xs text-blue-800">
                        <strong>Note:</strong> This downloads the incidents currently stored in the app memory (today's session).
                        For a persistent history, use the Reports page (Database logs).
                    </div>
                </div>
            </div>
        </div>
    );
}