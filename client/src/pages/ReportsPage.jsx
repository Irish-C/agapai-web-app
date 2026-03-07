// src/pages/ReportsPage.jsx

import React, { useState, useEffect } from 'react';
import { FaFileAlt, FaSpinner, FaExclamationTriangle, FaArrowRight } from 'react-icons/fa';
import { fetchReportsData } from '../services/apiService';

export default function ReportsPage() {
    const [logs, setLogs] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [limit, setLimit] = useState(20);

    const [startDate, setStartDate] = useState(''); 
    const [endDate, setEndDate] = useState('');

    useEffect(() => {
        const loadReportData = async () => {
            try {
                setIsLoading(true);
                setError(null);
                
                const data = await fetchReportsData(limit, startDate, endDate); 
                
                // Note: Ensure your backend returns 'data' or 'report'. 
                // Adjust 'data.report' to 'data.data' if you changed the backend key name.
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
    }, [limit, startDate, endDate]);

    const handleFileClick = (filePath) => {
        console.log(`File path clicked: ${filePath}`);
        alert(`Simulating file view/download for: ${filePath}`);
    };

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

        // --- ALWAYS RENDER THE TABLE STRUCTURE ---
        return (
            <div className="overflow-x-auto shadow-md rounded-lg border border-gray-200">
                <table className="min-w-full divide-y divide-gray-200 bg-white">
                    <thead className="bg-gray-50">
                        <tr>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Timestamp</th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Incident Classification</th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Location</th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Camera</th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ack. By User</th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">File Path</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {logs.length > 0 ? (
                            logs.map((log) => (
                                <tr key={log.id} className="hover:bg-teal-100 transition duration-150">
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                                        {new Date(log.timestamp).toLocaleString()}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 font-medium">
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
                                            log.status === 'unacknowledged' ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'
                                        }`}>
                                            {log.status}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                                        {log.status !== 'unacknowledged' ? (log.acknowledged_by_username || 'System') : 'Pending'}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                                        {log.file_path ? (
                                            <a href="#" onClick={(e) => { e.preventDefault(); handleFileClick(log.file_path); }} 
                                               className="flex items-center text-teal-600 hover:text-teal-800 font-medium">
                                                View File <FaArrowRight className="ml-2 text-xs" />
                                            </a>
                                        ) : 'N/A'}
                                    </td>
                                </tr>
                            ))
                        ) : (
                            // Empty State Row inside the table
                            <tr>
                                <td colSpan="7" className="px-6 py-10 text-center text-gray-500 italic">
                                    No event logs found in the database.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        );
    };

    return (
        <div className="container mx-auto p-6 space-y-6">
            <div className="flex items-center space-x-3">
                <FaFileAlt className="text-3xl text-teal-600" />
                <h1 className="text-3xl font-bold text-gray-800">Event Log History</h1>
            </div>
            <p className="text-gray-600 mx-4 sm:mx-8 lg:mx-16">
                Review historical fall and inactivity alerts from all locations to ensure comprehensive resident monitoring.
            </p>
            
            <div className="flex flex-wrap justify-end items-center gap-4">
                <div className="flex items-center">
                    <label className="text-sm font-medium text-gray-700 mr-2">Start Date:</label>
                    <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="p-2 border rounded-lg text-sm" />
                </div>
                <div className="flex items-center">
                    <label className="text-sm font-medium text-gray-700 mr-2">End Date:</label>
                    <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="p-2 border rounded-lg text-sm" />
                </div>
                <div className="flex items-center">
                    <label className="text-sm font-medium text-gray-700 mr-2">Logs per page:</label>
                    <select value={limit} onChange={(e) => setLimit(Number(e.target.value))} className="p-2 border rounded-lg text-sm">
                        <option value={20}>20</option>
                        <option value={50}>50</option>
                        <option value={100}>100</option>
                    </select>
                </div>
            </div>
            
            <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-200">
                {renderContent()}
            </div>
        </div>
    );
}