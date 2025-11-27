// src/components/TodayReport.jsx
import React, { useState, useEffect } from 'react'; // <-- Added useState and useEffect
import { 
    FaExclamationTriangle, 
    FaCheckCircle, 
    FaChartBar, 
    FaCalendarAlt, // <-- New Icon
    FaDownload,    // <-- New Icon
    FaFileAlt      // <-- New Icon
} from 'react-icons/fa';
import { fetchDailySummary } from '../services/apiService.js'; // <-- Import the new service function

/**
 * Renders the Today's Incident Log, Activity Summary, and Log Downloader sidebar.
 * It receives 'incidents' (real-time data) and 'user' (for the token) as props.
 */
export default function TodayReport({ incidents, user }) { // <-- Accepts user prop
    
    // --- STATE: Activity Summary (Original) ---
    const [activityData, setActivityData] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    // --- STATE: Log Downloader (New) ---
    // Default to today's date in YYYY-MM-DD format
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);

    // CONFIGURATION: Replace with your Raspberry Pi's IP Address and the backend port (from picam.py)
    const RPI_BASE_URL = "http://192.168.2.106:4050"; 


    // --- Data Fetching Effect for 24h Summary ---
    useEffect(() => {
        if (!user || !user.token) {
            setActivityData([]);
            setIsLoading(false);
            return;
        }

        const getDailySummary = async () => {
            setIsLoading(true);
            setError(null);
            try {
                // Call the new API service function
                const rawData = await fetchDailySummary(); 
                
                // --- Data Transformation (Example based on assumed API response) ---
                const total = rawData.moving_time + rawData.resting_time;
                const incident_count = incidents.length; // Use real-time count for Incidents

                const newActivityData = [
                    { label: 'Mov.', value: rawData.moving_time, percentage: `${Math.round((rawData.moving_time / total) * 100) || 0}%`, color: 'bg-teal-500' },
                    { label: 'Rest', value: rawData.resting_time, percentage: `${Math.round((rawData.resting_time / total) * 100) || 0}%`, color: 'bg-green-500' },
                    // Incident is often a separate metric, here we just show count
                    { label: 'Incid.', value: incident_count, percentage: `${incident_count > 0 ? 5 : 0}%`, color: 'bg-red-500'}
                ];

                setActivityData(newActivityData);

            } catch (err) {
                setError('Failed to load 24h summary.');
            } finally {
                setIsLoading(false);
            }
        };

        getDailySummary();
    // Re-run if user (token) changes or if the real-time incident count changes
    }, [user, incidents.length]); 

    
    // --- Determine System Status ---
    const incidentCount = incidents.length;
    const isClear = incidentCount === 0;

    // --- HELPER: Date Formatter ---
    const formatDateDisplay = (dateString) => {
        const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
        return new Date(dateString).toLocaleDateString(undefined, options);
    };

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
                    <div className="space-y-3 max-h-80 overflow-y-auto pr-2">
                        {incidents.map((incident, index) => (
                            <div 
                                key={index} 
                                className="p-3 bg-red-100 border border-red-400 text-red-800 rounded-lg flex items-start animate-pulse-once"
                            >
                                <FaExclamationTriangle className="mt-1 mr-3 flex-shrink-0 text-xl text-red-600" />
                                <div>
                                    <p className="font-bold text-base">{incident.type || 'Unknown Incident'}!</p>
                                    <p className="text-sm">Location: <span className='font-medium'>{incident.location}</span></p>
                                    <p className="text-xs text-gray-600 mt-1">Time: {new Date(incident.timestamp * 1000).toLocaleTimeString()}</p>
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
                
                {!isLoading && !error && activityData.length > 0 && (
                    <div className="space-y-4">
                        {activityData.map((data, index) => (
                            <div key={index}>
                                <div className="flex justify-between items-center text-sm font-medium text-gray-700 mb-1">
                                    <span>{data.label}</span>
                                    <span>{data.percentage}</span>
                                </div>
                                <div className="w-full bg-gray-200 rounded-full h-2.5">
                                    <div 
                                        className={`${data.color} h-2.5 rounded-full transition-all duration-700 ease-out`} 
                                        style={{ width: data.percentage }}
                                    ></div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
                <p className="text-xs text-gray-500 mt-4 text-center">Data refreshed daily.</p>
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