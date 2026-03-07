// src/pages/ReportsPage.jsx

import React, { useState, useEffect } from 'react';
import { 
    FaFileAlt, 
    FaSpinner, 
    FaExclamationTriangle, 
    FaArrowRight, 
    FaSearch, 
    FaTimes, 
    FaCircle,
    FaDownload 
} from 'react-icons/fa';
import { fetchReportsData } from '../services/apiService';

export default function ReportsPage() {
    const [logs, setLogs] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [limit, setLimit] = useState(100); 

    const [startDate, setStartDate] = useState(''); 
    const [endDate, setEndDate] = useState('');
    
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

    const uniqueClasses = ['All', ...new Set(logs.map(log => log.event_class_name || log.type).filter(Boolean))];

    const resetFilters = () => {
        setSearchTerm('');
        setFilterClass('All');
        setFilterStatus('All');
        setStartDate('');
        setEndDate('');
    };

    const handleExport = () => {
        // Implementation for CSV/Excel export
        console.log("Exporting filtered logs...", filteredLogs);
        alert("Exporting " + filteredLogs.length + " records to Excel...");
    };

    const handleFileClick = (filePath) => {
        alert(`Viewing snapshot: ${filePath}`);
    };

    const renderContent = () => {
        if (isLoading) return (
            <div className="flex flex-col justify-center items-center py-20 text-teal-600">
                <FaSpinner className="animate-spin mb-4 text-4xl" />
                <span className="text-lg font-medium">Syncing Logs...</span>
            </div>
        );

        if (error) return (
            <div className="flex justify-center items-center p-10 text-red-600 bg-red-50 border border-red-200 rounded-xl">
                <FaExclamationTriangle className="mr-3 text-2xl" />
                <span className="text-lg font-medium">System Error: {error}</span>
            </div>
        );

        return (
            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            {['Timestamp', 'Classification', 'Location', 'Status', 'Ack. By', 'Action'].map((head) => (
                                <th key={head} className="px-6 py-4 text-left text-sm font-bold text-gray-500 uppercase tracking-wider">
                                    {head}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-100">
                        {filteredLogs.length > 0 ? (filteredLogs.map((log) => (
                            <tr key={log.id} className="hover:bg-teal-50 transition-colors duration-200 group">
                                <td className="px-6 py-5 whitespace-nowrap text-base text-gray-700 font-medium">
                                    {new Date(log.timestamp).toLocaleDateString()}
                                    <span className="text-gray-400 ml-2 text-sm font-normal">
                                        {new Date(log.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                    </span>
                                </td>
                                <td className="px-6 py-5 whitespace-nowrap">
                                    <span className="text-sm font-bold text-teal-700 bg-teal-50 px-3 py-1.5 rounded-lg border border-teal-100">
                                        {log.event_class_name || log.type}
                                    </span>
                                </td>
                                <td className="px-6 py-5 whitespace-nowrap text-base text-gray-600">{log.location}</td>
                                <td className="px-6 py-5 whitespace-nowrap">
                                    <div className="flex items-center gap-2">
                                        <FaCircle className={`text-[10px] ${(log.status || '').toLowerCase() === 'unacknowledged' ? 'text-red-500 animate-pulse' : 'text-green-500'}`} />
                                        <span className={`text-sm font-bold uppercase tracking-tight ${(log.status || '').toLowerCase() === 'unacknowledged' ? 'text-red-600' : 'text-green-600'}`}>
                                            {log.status}
                                        </span>
                                    </div>
                                </td>
                                <td className="px-6 py-5 whitespace-nowrap text-base text-gray-500 italic">{log.acknowledged_by_username || 'System'}</td>
                                <td className="px-6 py-5 whitespace-nowrap text-right">
                                    <button 
                                        onClick={() => handleFileClick(log.file_path || log.snapshot_url)}
                                        className="p-2 text-gray-400 hover:text-teal-600 hover:bg-teal-50 rounded-full transition-all group-hover:translate-x-1"
                                    >
                                        <FaArrowRight size={18} />
                                    </button>
                                </td>
                            </tr>
                        ))) : (
                            <tr>
                                <td colSpan="6" className="px-6 py-20 text-center text-gray-500 text-lg italic">
                                    No records found matching your current filters.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        );
    };

    return (
        <div className="container mx-auto p-8 space-y-8">
            {/* Header Section */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                <div className="space-y-2">
                    <div className="flex items-center gap-3">
                        <div className="p-3 bg-teal-600 rounded-xl shadow-lg">
                            <FaFileAlt className="text-white text-2xl" />
                        </div>
                        <h1 className="text-4xl font-extrabold text-gray-800 tracking-tight">Event Logs</h1>
                    </div>
                    <p className="text-gray-500 text-lg font-medium">Detailed facility monitoring & incident history</p>
                </div>

                <div className="flex items-center gap-4">
                    {/* Stats Summary Panel */}
                    <div className="hidden sm:flex items-center gap-8 px-8 py-4 bg-white rounded-2xl border border-gray-200 shadow-sm">
                        <div className="text-center">
                            <span className="block text-teal-600 text-2xl font-bold">{filteredLogs.length}</span>
                            <span className="text-[10px] uppercase font-bold text-gray-400 tracking-widest">Total</span>
                        </div>
                        <div className="w-px h-10 bg-gray-100" />
                        <div className="text-center">
                            <span className="block text-red-500 text-2xl font-bold">
                                {filteredLogs.filter(l => (l.status || '').toLowerCase() === 'unacknowledged').length}
                            </span>
                            <span className="text-[10px] uppercase font-bold text-gray-400 tracking-widest">Alerts</span>
                        </div>
                    </div>
                    
                    <div className="relative">
                        <FaSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                        <input
                            type="text"
                            placeholder="Quick search..."
                            className="pl-12 pr-6 py-4 bg-white border border-gray-300 rounded-2xl focus:ring-4 focus:ring-teal-500/10 focus:border-teal-500 outline-none w-full sm:w-80 text-base font-medium transition-all shadow-sm"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>
            </div>

            {/* Filter Bar - Solid Background with Reset & Export Action Column */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-7 gap-5 items-end bg-white p-6 rounded-2xl border border-gray-200 shadow-md">
                {[
                    { label: 'Classification', value: filterClass, setter: setFilterClass, options: uniqueClasses },
                    { label: 'Status', value: filterStatus, setter: setFilterStatus, options: ['All', 'unacknowledged', 'acknowledged'] },
                    { label: 'From Date', value: startDate, setter: setStartDate, type: 'date' },
                    { label: 'To Date', value: endDate, setter: setEndDate, type: 'date' },
                    { label: 'Limit', value: limit, setter: setLimit, options: [20, 50, 100] }
                ].map((f, i) => (
                    <div key={i} className="space-y-2">
                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider ml-1">{f.label}</label>
                        {f.type === 'date' ? (
                            <input 
                                type="date" 
                                value={f.value} 
                                onChange={(e) => f.setter(e.target.value)} 
                                className="w-full p-3 bg-gray-50 border border-gray-300 rounded-xl text-sm font-semibold text-gray-700 outline-none focus:border-teal-500 transition-all shadow-sm" 
                            />
                        ) : (
                            <select 
                                value={f.value} 
                                onChange={(e) => f.setter(f.label === 'Limit' ? Number(e.target.value) : e.target.value)} 
                                className="w-full p-3 bg-gray-50 border border-gray-300 rounded-xl text-sm font-semibold text-gray-700 outline-none focus:border-teal-500 transition-all cursor-pointer capitalize"
                            >
                                {f.options.map(opt => (
                                    <option key={opt} value={opt}>
                                        {opt === 'unacknowledged' ? 'Unacknowledged' : opt === 'acknowledged' ? 'Acknowledged' : opt}
                                    </option>
                                ))}
                            </select>
                        )}
                    </div>
                ))}
                
                {/* Unified Action Column */}
                <div className="lg:col-span-2 flex gap-3 h-[50px]">
                    <button 
                        onClick={handleExport}
                        className="flex-1 flex items-center justify-center gap-2 bg-teal-600 text-white rounded-xl hover:bg-teal-700 text-xs font-bold uppercase tracking-widest transition-all shadow-lg active:scale-95"
                    >
                        <FaDownload size={14} /> Export
                    </button>
                    <button 
                        onClick={resetFilters}
                        className="flex-1 flex items-center justify-center gap-2 bg-gray-800 text-white rounded-xl hover:bg-gray-700 text-xs font-bold uppercase tracking-widest transition-all shadow-lg active:scale-95"
                    >
                        <FaTimes size={14} /> Reset
                    </button>
                </div>
            </div>

            {/* Main Content Card */}
            <div className="bg-white rounded-3xl shadow-xl border border-gray-200 overflow-hidden">
                {renderContent()}
            </div>
        </div>
    );
}