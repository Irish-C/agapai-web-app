// src/components/TodayReport.jsx
import React, { useState, useEffect } from 'react'; // <-- Added useState and useEffect
import { FaExclamationTriangle, FaCheckCircle, FaChartBar } from 'react-icons/fa';
import { fetchDailySummary } from '../services/apiService.js'; // <-- Import the new service function

/**
 * Renders the Today's Incident Log and Activity Summary sidebar.
 * It receives 'incidents' (real-time data) and 'user' (for the token) as props.
 */
export default function TodayReport({ incidents, user }) { // <-- Accepts user prop
    
    // State to hold the fetched 24-hour activity data
    const [activityData, setActivityData] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

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
                    { label: 'Incid.', value: incident_count, percentage: `${incident_count > 0 ? 5 : 0}%`, color: 'bg-red-500' },
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
        </div>
    );
}