// src/components/TodayReport.jsx
import React, { useState, useMemo, useEffect } from 'react';
import { FaExclamationTriangle, FaCheckCircle, FaDownload, FaFileAlt, FaCheck } from 'react-icons/fa';
import { fetchReportsData, fetchApi } from '../../services/apiService.js';

/**
 * Renders the Today's Incident Log, Activity Summary, and Log Downloader sidebar.
 * It receives 'incidents' (real-time data) and 'user' (for the token) as props.
 * Also fetches today's persisted logs from the database.
 */
export default function TodayReport({ incidents = [], alerts = [], user }) {
    
    // --- STATE ---
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);
    const [allIncidents, setAllIncidents] = useState([]);
    const [acknowledgeLoading, setAcknowledgeLoading] = useState({});

    // --- STATE: Log Downloader (New) ---
    // Default to today's date in YYYY-MM-DD format
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);

    // CONFIGURATION: Replace with your Raspberry Pi's IP Address and the backend port (from picam.py)
    const RPI_BASE_URL = "http://192.168.2.106:4050";

    // Fetch today's persisted logs from database (only once on mount)
    useEffect(() => {
        const fetchTodaysLogs = async () => {
            try {
                const today = new Date().toISOString().split('T')[0];
                const response = await fetchReportsData(1000, today, today);
                const todaysLogs = response.report || response.data || [];
                
                // Store database logs - will be merged with real-time incidents below
                setAllIncidents(todaysLogs);
            } catch (err) {
                console.error('Failed to fetch today logs from database:', err);
                setAllIncidents([]);
            }
        };
        
        fetchTodaysLogs();
    }, []); // Empty dependency = fetch only once on mount 

    // --- Helper: sorted incident list for display ---
    const sortedIncidents = useMemo(() => {
        const todayKey = new Date().toISOString().split('T')[0];
        
        // Combine database logs + real-time incidents
        const combined = [...allIncidents, ...incidents];
        
        // Remove duplicates by timestamp + type
        const unique = Array.from(new Map(
            combined.map(item => {
                const key = `${item.ts || item.timestamp || 0}-${item.type || item.event_class || 'unknown'}`;
                return [key, item];
            })
        ).values());

        return (unique || [])
            .filter((inc) => {
                const ts = inc.ts || inc.timestamp || 0;
                if (!ts) return false;
                const dateKey = new Date(ts).toISOString().split('T')[0];
                return dateKey === todayKey;
            })
            .sort((a, b) => (b.ts || 0) - (a.ts || 0));
    }, [allIncidents, incidents]);

    // --- Derived State ---
    // Count ALL incidents from today, regardless of acknowledgment status
    const incidentCount = sortedIncidents.length;
    const isClear = incidentCount === 0;

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

    // --- ACTION: Acknowledge Incident (Database Update) ---
    const acknowledgeIncident = async (incident) => {
        // Use the incident's database ID if available, otherwise use timestamp as fallback
        const incidentId = incident.id || incident.log_id;
        if (!incidentId) {
            console.error('Cannot acknowledge incident without ID');
            setError('Error: Invalid incident ID');
            return;
        }

        try {
            setAcknowledgeLoading(prev => ({ ...prev, [incidentId]: true }));
            setError(null);

            // Call the backend API to acknowledge the incident in the database
            const response = await fetchApi(`/events/${incidentId}/acknowledge`, 'POST');
            
            if (response.status === 'success') {
                // Update the incident in state to reflect acknowledged status
                setAllIncidents(prev => 
                    prev.map(inc => 
                        (inc.id === incidentId || inc.log_id === incidentId)
                            ? { ...inc, status: 'acknowledged', event_status: 'acknowledged' }
                            : inc
                    )
                );
            } else {
                setError('Failed to acknowledge incident. Please try again.');
            }
        } catch (err) {
            console.error('Error acknowledging incident:', err);
            setError('Error acknowledging incident. Please try again.');
        } finally {
            setAcknowledgeLoading(prev => ({ ...prev, [incidentId]: false }));
        }
    };

    // --- ACTION: Unacknowledge Incident (Database Update) ---
    const unacknowledgeIncident = async (incident) => {
        // Use the incident's database ID if available, otherwise use timestamp as fallback
        const incidentId = incident.id || incident.log_id;
        if (!incidentId) {
            console.error('Cannot unacknowledge incident without ID');
            setError('Error: Invalid incident ID');
            return;
        }

        try {
            setAcknowledgeLoading(prev => ({ ...prev, [incidentId]: true }));
            setError(null);

            // Call the backend API to unacknowledge the incident in the database
            // Assuming there's a PATCH endpoint or similar for updating status
            const response = await fetchApi(`/events/${incidentId}/unacknowledge`, 'POST');
            
            if (response.status === 'success') {
                // Update the incident in state to reflect unacknowledged status
                setAllIncidents(prev => 
                    prev.map(inc => 
                        (inc.id === incidentId || inc.log_id === incidentId)
                            ? { ...inc, status: 'unacknowledged', event_status: 'unacknowledged' }
                            : inc
                    )
                );
            } else {
                setError('Failed to unacknowledge incident. Please try again.');
            }
        } catch (err) {
            console.error('Error unacknowledging incident:', err);
            setError('Error unacknowledging incident. Please try again.');
        } finally {
            setAcknowledgeLoading(prev => ({ ...prev, [incidentId]: false }));
        }
    };

    // --- ACTION: Download Incident Log (client-side export) ---
    const downloadIncidentLog = () => {
        setError(null);
        setIsLoading(true);

        try {
            const payload = {
                date: selectedDate,
                incidents: sortedIncidents || [],
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
        <div className="space-y-4 sticky top-2 h-fit w-full">

            {/* 1. REAL-TIME INCIDENT LOG (WebSocket Data) */}
            <div className="bg-white p-4 rounded-xl shadow-lg border border-gray-200 w-full">
                <h3 className="text-xl font-bold text-gray-800 mb-4 border-b pb-2">Today's Incident Log</h3>

                {isClear ? (
                    <div className="p-4 bg-green-50 border border-green-300 text-green-700 rounded-lg flex items-center">
                        <FaCheckCircle className="mr-3 text-xl" />
                        <p className="font-semibold">No incidents recorded today.</p>
                    </div>
                ) : (
                    <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
                        {sortedIncidents.map((incident, idx) => {
                            const type = getIncidentType(incident);
                            const time = getIncidentTimestamp(incident);
                            const snapshotUrl = getSnapshotUrl(incident);
                            const incidentId = incident.id || incident.log_id;
                            const incidentStatus = incident.status || incident.event_status || 'unacknowledged';
                            const isAcknowledged = incidentStatus === 'acknowledged';
                            const isLoading = acknowledgeLoading[incidentId];
                            const location =
                                incident.location ||
                                incident.location_name ||
                                incident.loc_name ||
                                incident.camId ||
                                incident.camera_id ||
                                incident.cameraId ||
                                'Unknown Location';

                            return (
                                <div key={idx} className={`p-4 rounded-lg border transition-all ${isAcknowledged ? 'bg-gray-50 border-gray-200' : 'bg-red-200 border-red-500'}`}>
                                    {/* Header Section */}
                                    <div className="flex items-start justify-between gap-4 mb-3">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2 mb-2">
                                                <FaExclamationTriangle className={`text-lg ${isAcknowledged ? 'text-gray-400' : 'text-red-700'}`} />
                                                <span className={`font-bold text-base ${isAcknowledged ? 'text-gray-600' : 'text-red-700'}`}>{type}</span>
                                                {isAcknowledged && (
                                                    <span className="text-xs font-semibold text-green-600 flex items-center gap-1 bg-green-100 px-2 py-1 rounded-full">
                                                        <FaCheck className="text-xs" /> Acknowledged
                                                    </span>
                                                )}
                                            </div>
                                            <div className={`text-sm mt-1 ${isAcknowledged ? 'text-gray-500' : 'text-gray-600'}`}>
                                                <span className="font-medium">{location}</span>
                                                <span className="text-xs text-gray-500 ml-2">@ {time}</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Action Buttons Section */}
                                    <div className="flex gap-2">
                                        {snapshotUrl && (
                                            <a
                                                href={snapshotUrl}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className={`flex-1 text-xs font-semibold text-center px-3 py-2 rounded transition-colors ${
                                                    isAcknowledged
                                                        ? 'text-gray-600 bg-gray-200 hover:bg-gray-300'
                                                        : 'text-gray-700 bg-red-200 hover:bg-gray-300'
                                                }`}
                                            >
                                                View
                                            </a>
                                        )}
                                        {isAcknowledged ? (
                                            <button
                                                onClick={() => unacknowledgeIncident(incident)}
                                                disabled={isLoading}
                                                className={`flex-1 text-xs font-semibold px-3 py-2 rounded transition-all ${
                                                    isLoading
                                                        ? 'bg-gray-300 text-gray-600 cursor-not-allowed opacity-60'
                                                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300 cursor-pointer'
                                                }`}
                                            >
                                                {isLoading ? 'Updating...' : 'Unacknowledge'}
                                            </button>
                                        ) : (
                                            <button
                                                onClick={() => acknowledgeIncident(incident)}
                                                disabled={isLoading}
                                                className={`flex-1 text-xs font-semibold px-3 py-2 rounded transition-all ${
                                                    isLoading
                                                        ? 'bg-green-300 text-green-700 cursor-not-allowed opacity-60'
                                                        : 'bg-red-500 text-white hover:bg-gray-500 cursor-pointer'
                                                }`}
                                            >
                                                {isLoading ? 'Acknowledging...' : 'Acknowledge'}
                                            </button>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* 3. LOG PANEL / EXPORT LOGS - COMMENTED OUT */}
            {/* <div className="bg-white p-4 rounded-xl shadow-lg border border-gray-200">
                <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center border-b pb-2">
                    Download Incident Log
                </h3>

                <div className="space-y-4">
                    {/* Date Selection */}
                    {/* <div>
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
                    {/* <div>
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
                    {/* <div className="p-3 bg-blue-50 border border-blue-200 rounded-md text-xs text-blue-800">
                        <strong>Note:</strong> This downloads the incidents currently stored in the app memory (today's session).
                        For a persistent history, use the Reports page (Database logs).
                    </div>
                </div>
            </div> */}
        </div>
    );
}