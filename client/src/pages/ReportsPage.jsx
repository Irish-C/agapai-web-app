// src/pages/ReportsPage.jsx

import React, { useState, useEffect } from 'react';
import { 
    FaFileAlt, FaSpinner, FaExclamationTriangle, FaArrowRight, 
    FaSearch, FaTimes, FaCircle, FaDownload, FaFilter, FaChevronDown 
} from 'react-icons/fa';
import { fetchReportsData } from '../services/apiService';

export default function ReportsPage() {
    const [logs, setLogs] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [limit, setLimit] = useState(100); 
    const [showFilters, setShowFilters] = useState(true); // Toggle for collapsing

    const [startDate, setStartDate] = useState(''); 
    const [endDate, setEndDate] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [filterClass, setFilterClass] = useState([]);
    const [filterStatus, setFilterStatus] = useState([]);

    useEffect(() => {
        const loadReportData = async () => {
            try {
                setIsLoading(true);
                const response = await fetchReportsData(limit, startDate, endDate); 
                const dataArray = response.report || response.data || [];
                if (response.status === 'success' || Array.isArray(dataArray)) {
                    setLogs(dataArray);
                }
            } catch (err) {
                setError(err.message);
            } finally {
                setIsLoading(false);
            }
        }; 
        loadReportData(); 
    }, [limit, startDate, endDate]);

    const filteredLogs = logs.filter(log => {
        const classification = log.event_class_name || log.type || '';
        const location = (log.location || '').toLowerCase();
        const matchesSearch = classification.toLowerCase().includes(searchTerm.toLowerCase()) || location.includes(searchTerm.toLowerCase());
        const matchesClass = filterClass.length === 0 || filterClass.includes(classification);
        const matchesStatus = filterStatus.length === 0 || filterStatus.includes(log.status || '');
        return matchesSearch && matchesClass && matchesStatus;
    });

    const uniqueClasses = [...new Set(logs.map(log => log.event_class_name || log.type).filter(Boolean))];

    const toggleFilter = (item, currentArray, setter) => {
        setter(currentArray.includes(item) ? currentArray.filter(i => i !== item) : [...currentArray, item]);
    };

    const resetFilters = () => {
        setSearchTerm(''); setFilterClass([]); setFilterStatus([]); setStartDate(''); setEndDate('');
    };

    return (
        <div className="container mx-auto p-6 space-y-4">
            {/* COMPACT HEADER */}
            <div className="flex flex-col md:flex-row justify-between items-center gap-4 bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-teal-600 rounded-lg shadow-md"><FaFileAlt className="text-white text-lg" /></div>
                    <h1 className="text-2xl font-bold text-gray-800">Event Logs</h1>
                    <span className="bg-gray-100 text-gray-500 text-xs font-bold px-2.5 py-1 rounded-full">{filteredLogs.length} Records</span>
                </div>

                <div className="flex items-center gap-2">
                    <div className="relative">
                        <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
                        <input
                            type="text"
                            placeholder="Search..."
                            className="pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-teal-500/20 outline-none w-48 lg:w-64 text-sm font-medium transition-all"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <button 
                        onClick={() => setShowFilters(!showFilters)}
                        className={`p-2 rounded-xl border transition-all ${showFilters ? 'bg-teal-50 border-teal-200 text-teal-600' : 'bg-white border-gray-200 text-gray-500'}`}
                    >
                        <FaFilter size={14} />
                    </button>
                </div>
            </div>

            {/* COLLAPSIBLE COMPACT FILTER RIBBON */}
            {showFilters && (
                <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm animate-in slide-in-from-top-2 duration-300">
                    <div className="flex flex-wrap gap-8">
                        {/* Classification Multi-Pick */}
                        <div className="flex-1 min-w-[200px] space-y-2">
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Classification</label>
                            <div className="flex flex-wrap gap-1.5">
                                {uniqueClasses.map(opt => (
                                    <button
                                        key={opt}
                                        onClick={() => toggleFilter(opt, filterClass, setFilterClass)}
                                        className={`px-3 py-1 rounded-lg text-xs font-bold border transition-all ${filterClass.includes(opt) ? 'bg-teal-600 text-white border-teal-600' : 'bg-gray-50 text-gray-500 border-gray-100 hover:border-teal-200'}`}
                                    >
                                        {opt}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Status Multi-Pick */}
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Status</label>
                            <div className="flex gap-1.5">
                                {['unacknowledged', 'acknowledged'].map(opt => (
                                    <button
                                        key={opt}
                                        onClick={() => toggleFilter(opt, filterStatus, setFilterStatus)}
                                        className={`px-3 py-1 rounded-lg text-xs font-bold border transition-all capitalize ${filterStatus.includes(opt) ? 'bg-teal-600 text-white border-teal-600' : 'bg-gray-50 text-gray-500 border-gray-100 hover:border-teal-200'}`}
                                    >
                                        {opt}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Date & Limit Row */}
                        <div className="flex flex-wrap items-end gap-3 border-l border-gray-100 pl-8">
                            <div className="space-y-1">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Range</label>
                                <div className="flex items-center bg-gray-50 border border-gray-200 rounded-xl overflow-hidden">
                                    <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="p-2 bg-transparent text-xs font-bold text-gray-600 outline-none" />
                                    <span className="text-gray-300 mx-1">-</span>
                                    <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="p-2 bg-transparent text-xs font-bold text-gray-600 outline-none" />
                                </div>
                            </div>
                            <div className="space-y-1">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Limit</label>
                                <select value={limit} onChange={(e) => setLimit(Number(e.target.value))} className="p-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-gray-600 outline-none cursor-pointer">
                                    <option value={20}>20</option><option value={50}>50</option><option value={100}>100</option>
                                </select>
                            </div>
                            <div className="flex gap-2">
                                <button onClick={() => alert("Exporting...")} className="p-2 bg-teal-600 text-white rounded-xl hover:bg-teal-700 transition-all shadow-md active:scale-95"><FaDownload size={12} /></button>
                                <button onClick={resetFilters} className="p-2 bg-gray-800 text-white rounded-xl hover:bg-gray-700 transition-all shadow-md active:scale-95"><FaTimes size={12} /></button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* TABLE SECTION */}
            <div className="bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden">
                <table className="min-w-full divide-y divide-gray-100">
                    <thead className="bg-gray-50/50">
                        <tr>
                            {['Timestamp', 'Classification', 'Location', 'Status', 'Ack. By', 'Action'].map((head) => (
                                <th key={head} className="px-6 py-3 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">{head}</th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                        {filteredLogs.length > 0 ? (filteredLogs.map((log) => (
                            <tr key={log.id} className="hover:bg-teal-50/30 transition-all">
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 font-medium">{new Date(log.timestamp).toLocaleDateString()} <span className="text-gray-300 text-[10px]">{new Date(log.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span></td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-teal-700">{log.event_class_name || log.type}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{log.location}</td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="flex items-center gap-2">
                                        <FaCircle className={`text-[8px] ${(log.status || '').toLowerCase() === 'unacknowledged' ? 'text-red-500 animate-pulse' : 'text-green-500'}`} />
                                        <span className={`text-[10px] font-black uppercase ${(log.status || '').toLowerCase() === 'unacknowledged' ? 'text-red-600' : 'text-green-600'}`}>{log.status}</span>
                                    </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-xs text-gray-400 italic">{log.acknowledged_by_username || 'System'}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-right"><button className="p-2 text-gray-300 hover:text-teal-600 transition-all"><FaArrowRight size={14} /></button></td>
                            </tr>
                        ))) : (
                            <tr><td colSpan="6" className="px-6 py-20 text-center text-gray-400 text-sm italic">No matching records found.</td></tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}