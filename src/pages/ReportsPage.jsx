/* src/pages/ReportsPage.jsx

 * This component fetches real event logs from the apiService
 * and displays them in a table format.
 */
import React, { useState, useEffect } from 'react';
import { fetchReportsData } from '../services/apiService';
import { FaFileAlt, FaSpinner, FaExclamationTriangle } from 'react-icons/fa';

export default function ReportsPage() {
    const [logs, setLogs] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const loadReportData = async () => {
            try {
                setIsLoading(true);
                setError(null);
                const data = await fetchReportsData();
                
                if (data.status === 'success' && Array.isArray(data.report)) {
                    setLogs(data.report);
                } else {
                    throw new Error(data.message || 'Failed to fetch report data');
                }
            } catch (err) {
                console.error("Error fetching report data:", err);
                setError(err.message);
            } finally {
                setIsLoading(false);
            }
        };

        loadReportData();
    }, []);

    const renderContent = () => {
        if (isLoading) {
            return (
                <div className="flex justify-center items-center p-10 text-gray-500">
                    <FaSpinner className="animate-spin mr-3 text-2xl" />
                    <span className="text-lg">Loading report data...</span>
                </div>
            );
        }

        if (error) {
            return (
                <div className="flex justify-center items-center p-10 text-red-600 bg-red-50 border border-red-300 rounded-lg">
                    <FaExclamationTriangle className="mr-3 text-2xl" />
                    <span className="text-lg">Error: {error}</span>
                </div>
            );
        }

        if (logs.length === 0) {
            return (
                <div className="flex justify-center items-center p-10 text-gray-500">
                    <span className="text-lg">No event logs found in the database.</span>
                </div>
            );
        }

        // Render the table with logs
        return (
            <div className="overflow-x-auto shadow-md rounded-lg border border-gray-200">
                <table className="min-w-full divide-y divide-gray-200 bg-white">
                    <thead className="bg-gray-50">
                        <tr>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Timestamp
                            </th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Incident Classification
                            </th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Location
                            </th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Camera
                            </th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Status
                            </th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Ack. By User
                            </th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {logs.map((log) => (
                            <tr key={log.id} className="hover:bg-gray-50">
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                                    {new Date(log.timestamp).toLocaleString()}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 font-medium">
                                    {/* CHANGED: Displaying Event Class Name */}
                                    {log.event_class_name || 'N/A'}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                                    {log.location}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                                    {log.camera_name}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm">
                                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                        log.status === 'unacknowledged' 
                                            ? 'bg-red-100 text-red-800' 
                                            : 'bg-green-100 text-green-800'
                                    }`}>
                                        {log.status}
                                    </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                                    {/* CHANGED: Displaying Acknowledged By Username */}
                                    {log.status !== 'unacknowledged' ? (log.acknowledged_by_username || 'System') : 'Pending'}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        );
    };

    return (
        <div className="container mx-auto p-6 space-y-6">
            <div className="flex items-center space-x-3">
                <FaFileAlt className="text-3xl text-teal-600" />
                <h1 className="text-3xl font-bold text-gray-800">
                    Event Log History
                </h1>
            </div>
            <p className="text-gray-600 mx-4 sm:mx-8 lg:mx-16">
                These are the complete audit logs of all vision-based events detected by the system. 
                Review historical fall and inactivity alerts from all locations to ensure comprehensive 
                resident monitoring and facility oversight.
            </p>
            
            <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-200">
                {renderContent()}
            </div>
        </div>
    );
}