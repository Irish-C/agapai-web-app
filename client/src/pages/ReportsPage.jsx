// src/pages/ReportsPage.jsx

import React, { useState, useEffect } from 'react';
import { FaFileAlt, FaSpinner, FaExclamationTriangle, FaArrowRight, FaSearch, FaTimes } from 'react-icons/fa';
import { fetchReportsData } from '../services/apiService';

export default function ReportsPage() {
    const [logs, setLogs] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [limit, setLimit] = useState(100); // Default to matching your screenshot
    const [startDate, setStartDate] = useState(''); 
    const [endDate, setEndDate] = useState('');
    
    // FILTER STATES
    const [searchTerm, setSearchTerm] = useState('');
    const [filterClass, setFilterClass] = useState('All');
    const [filterStatus, setFilterStatus] = useState('All');

    useEffect(() => {
        const loadReportData = async () => {
            try {
                setIsLoading(true);
                setError(null);
                const response = await fetchReportsData(limit, startDate, endDate); 
                
                // Defensive check for backend response structure
                const dataArray = response.report || response.data || [];
                
                if (response.status === 'success' || Array.isArray(dataArray)) {
                    setLogs(dataArray);
                } else {
                    throw new Error(response.message || 'Failed to fetch report data');
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

    // --- MULTI-FILTER LOGIC ---
    const filteredLogs = logs.filter(log => {
        const classification = (log.event_class_name || log.type || '').toLowerCase();
        const location = (log.location || '').toLowerCase();
        const search = searchTerm.toLowerCase();
        const status = (log.status || '').toLowerCase();
        
        const matchesSearch = classification.includes(search) || location.includes(search);
        const matchesClass = filterClass === 'All' || classification === filterClass.toLowerCase();
        const matchesStatus = filterStatus === 'All' || status === filterStatus.toLowerCase();

        return matchesSearch && matchesClass && matchesStatus;
    });

    // Extract unique classifications for the dropdown dynamically
    const uniqueClasses = ['All', ...new Set(logs.map(log => log.event_class_name || log.type).filter(Boolean))];

    const resetFilters = () => {
        setSearchTerm('');
        setFilterClass('All');
        setFilterStatus('All');
        setStartDate('');
        setEndDate('');
    };

    const handleFileClick = (filePath) => {
        alert(`Viewing snapshot: ${filePath}`);
    };

    const renderContent = () => {
        if (isLoading) return (
            <div className="flex justify-center items-center p-10 text-gray-500">
                <FaSpinner className="animate-spin mr-3 text-2xl" />
                <span className="text-lg">Loading report data...</span>
            </div>
        );

        if (error) return (
            <div className="flex justify-center items-center p-10 text-red-600 bg-red-50 border border-red-300 rounded-lg">
                <FaExclamationTriangle className="mr-3 text-2xl" />
                <span className="text-lg">Error: {error}</span>
            </div>
        );

        return (
            <div className="overflow-x-auto shadow-md rounded-lg border border-gray-200">
                <table className="min-w-full divide-y divide-gray-200 bg-white">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Timestamp</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Classification</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Location</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Status</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Ack. By</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">File</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {filteredLogs.length > 0 ? (
                            filteredLogs.map((log) => (
                                <tr key={log.id} className="hover:bg-teal-50 transition duration-150">
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                                        {new Date(log.timestamp).toLocaleString()}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                        {log.event_class_name || log.type}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                                        {log.location}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                                        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                                            (log.status || '').toLowerCase() === 'unacknowledged' ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'
                                        }`}>
                                            {log.status}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                                        {log.acknowledged_by_username || '-'}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                                        {log.file_path || log.snapshot_url ? (
                                            <button onClick={() => handleFileClick(log.file_path || log.snapshot_url)} className="text-teal-600 hover:text-teal-900">
                                                <FaArrowRight />
                                            </button>
                                        ) : 'N/A'}
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan="6" className="px-6 py-10 text-center text-gray-500 italic">
                                    No records found matching your filters.
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
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div className="flex items-center space-x-3">
                    <FaFileAlt className="text-3xl text-teal-900" />
                    <h1 className="text-3xl font-bold text-teal-900">Event Log History</h1>
                </div>
                
                <div className="flex flex-wrap items-center gap-3">
                    {/* SEARCH BAR */}
                    <div className="relative">
                        <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-400"><FaSearch /></span>
                        <input
                            type="text"
                            placeholder="Search location..."
                            className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 outline-none w-full sm:w-64 text-sm bg-white bg-opacity-90"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    {/* RESET BUTTON */}
                    <button 
                        onClick={resetFilters}
                        className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 text-gray-600 rounded-lg hover:bg-gray-100 text-sm transition shadow-sm"
                    >
                        <FaTimes /> Reset
                    </button>
                </div>
            </div>

            {/* FILTER BAR - Transparent version to remove the white background card */}
            <div className="bg-transparent p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                <div>
                    <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Classification</label>
                    <select value={filterClass} onChange={(e) => setFilterClass(e.target.value)} className="w-full p-2 border border-gray-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-teal-500 outline-none">
                        {uniqueClasses.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                </div>
                <div>
                    <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Status</label>
                    <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="w-full p-2 border border-gray-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-teal-500 outline-none">
                        <option value="All">All Statuses</option>
                        <option value="unacknowledged">Unacknowledged</option>
                        <option value="acknowledged">Acknowledged</option>
                    </select>
                </div>
                <div>
                    <label className="block text-xs font-bold text-gray-400 uppercase mb-1">From Date</label>
                    <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="w-full p-2 border border-gray-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-teal-500 outline-none" />
                </div>
                <div>
                    <label className="block text-xs font-bold text-gray-400 uppercase mb-1">To Date</label>
                    <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="w-full p-2 border border-gray-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-teal-500 outline-none" />
                </div>
                <div>
                    <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Limit</label>
                    <select value={limit} onChange={(e) => setLimit(Number(e.target.value))} className="w-full p-2 border border-gray-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-teal-500 outline-none">
                        <option value={20}>Last 20</option>
                        <option value={50}>Last 50</option>
                        <option value={100}>Last 100</option>
                    </select>
                </div>
            </div>

            <div className="bg-white rounded-xl shadow-lg border border-gray-200">
                {renderContent()}
            </div>
        </div>
    );
}