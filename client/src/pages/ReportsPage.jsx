// src/pages/ReportsPage.jsx

import React, { useState, useEffect } from 'react';
import { 
    FaFileAlt, FaSpinner, FaExclamationTriangle, FaArrowRight, 
    FaSearch, FaTimes, FaCircle, FaDownload, FaFilter 
} from 'react-icons/fa';
import { fetchReportsData, fetchApi } from '../services/apiService';

export default function ReportsPage() {
    const ALLOWED_LIMITS = [20, 50, 100, 1000];

    // --- STATE MANAGEMENT ---
    const [logs, setLogs] = useState([]);
    const [classifications, setClassifications] = useState([]); // Dynamic from DB
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [limit, setLimit] = useState(100); 
    const [showFilters, setShowFilters] = useState(true);

    // Filter States
    const [startDate, setStartDate] = useState(''); 
    const [endDate, setEndDate] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [filterClass, setFilterClass] = useState([]);
    const [filterStatus, setFilterStatus] = useState([]);
    const [showAllClassifications, setShowAllClassifications] = useState(false);

    // Pagination States
    const [currentPage, setCurrentPage] = useState(1);
    const rowsPerPage = 10;

    // --- DATA FETCHING ---
    useEffect(() => {
        const loadPageData = async () => {
            try {
                setIsLoading(true);
                
                // Fetch Logs and Classifications in parallel for speed
                const [logResponse, classResponse] = await Promise.all([
                    fetchReportsData(limit, startDate, endDate),
                    fetchApi('/event-types', 'GET') // Fetches dynamic types from database
                ]);

                // Handle Logs
                const dataArray = logResponse.report || logResponse.data || [];
                if (logResponse.status === 'success' || Array.isArray(dataArray)) {
                    setLogs(dataArray);
                }

                // Merge classifications from DB event types and fetched logs
                const dbClassifications = Array.isArray(classResponse)
                    ? classResponse.map(c => c.name || c.type).filter(Boolean)
                    : [];
                const logClassifications = Array.isArray(dataArray)
                    ? dataArray.map(log => log.event_class_name || log.type).filter(Boolean)
                    : [];

                setClassifications([...new Set([...dbClassifications, ...logClassifications])]);

                setCurrentPage(1); 
            } catch (err) {
                setError(err.message);
            } finally {
                setIsLoading(false);
            }
        }; 
        loadPageData(); 
    }, [limit, startDate, endDate]);

    // --- FILTER LOGIC ---
    const filteredLogs = logs.filter(log => {
        const classification = log.event_class_name || log.type || '';
        const location = (log.location || '').toLowerCase();
        const matchesSearch = classification.toLowerCase().includes(searchTerm.toLowerCase()) || 
                             location.includes(searchTerm.toLowerCase());
        const matchesClass = filterClass.length === 0 || filterClass.includes(classification);
        const matchesStatus = filterStatus.length === 0 || filterStatus.includes(log.status || '');
        return matchesSearch && matchesClass && matchesStatus;
    });

    // --- PAGINATION CALCULATIONS ---
    const indexOfLastRow = currentPage * rowsPerPage;
    const indexOfFirstRow = indexOfLastRow - rowsPerPage;
    const currentRows = filteredLogs.slice(indexOfFirstRow, indexOfLastRow);
    const totalPages = Math.ceil(filteredLogs.length / rowsPerPage);
    const visibleClassifications = showAllClassifications
        ? classifications
        : classifications.filter((opt, idx) => idx === 0 || filterClass.includes(opt));

    // --- HANDLERS ---
    const sanitizeSearchInput = (value) => {
        if (typeof value !== 'string') return '';
        return value
            .replace(/[<>`"']/g, '')
            .replace(/\s{2,}/g, ' ')
            .slice(0, 100);
    };

    const sanitizeDateInput = (value) => {
        if (typeof value !== 'string') return '';
        const trimmed = value.trim();
        return /^\d{4}-\d{2}-\d{2}$/.test(trimmed) ? trimmed : '';
    };

    const sanitizeLimitInput = (value) => {
        const numeric = Number(value);
        return ALLOWED_LIMITS.includes(numeric) ? numeric : 100;
    };

    const sanitizeCsvValue = (value) => {
        const safeValue = value ?? '';
        let stringValue = String(safeValue);

        // Prevent CSV formula injection in spreadsheet apps.
        if (/^[=+\-@\t\r]/.test(stringValue)) {
            stringValue = `'${stringValue}`;
        }

        return stringValue.replace(/"/g, '""');
    };

    const toggleFilter = (item, currentArray, setter) => {
        setter(currentArray.includes(item) ? currentArray.filter(i => i !== item) : [...currentArray, item]);
    };

    const resetFilters = () => {
        setSearchTerm(''); setFilterClass([]); setFilterStatus([]); setStartDate(''); setEndDate('');
    };

    const handleGenerateReport = () => {
        if (filteredLogs.length === 0) {
            alert('No filtered records available to export.');
            return;
        }

        const headers = ['Timestamp', 'Classification', 'Location', 'Status', 'Acknowledged By', 'Snapshot URL'];
        const escapeCsv = (value) => {
            return `"${sanitizeCsvValue(value)}"`;
        };

        const rows = filteredLogs.map((log) => {
            const timestamp = log.timestamp ? new Date(log.timestamp).toISOString() : '';
            const classification = log.event_class_name || log.type || '';
            const location = log.location || '';
            const status = log.status || '';
            const acknowledgedBy = log.acknowledged_by_username || 'System';
            const snapshotUrl = log.snapshot_url || '';

            return [timestamp, classification, location, status, acknowledgedBy, snapshotUrl]
                .map(escapeCsv)
                .join(',');
        });

        const csvContent = [headers.join(','), ...rows].join('\n');
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');

        link.href = url;
        link.download = `event_report_${timestamp}.csv`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    };

    const renderTableBody = () => {
        if (isLoading) return (
            <tr>
                <td colSpan="6" className="py-20 text-center text-teal-600">
                    <FaSpinner className="animate-spin inline mr-3 text-2xl" />
                    <span className="text-lg font-medium">Syncing with Database...</span>
                </td>
            </tr>
        );

        if (error) return (
            <tr>
                <td colSpan="6" className="py-20 text-center text-red-500 font-medium font-sans">
                    <FaExclamationTriangle className="inline mr-2" /> Error: {error}
                </td>
            </tr>
        );

        if (currentRows.length === 0) return (
            <tr>
                <td colSpan="6" className="px-8 py-32 text-center text-gray-400 font-medium italic font-sans">
                    No matching records found.
                </td>
            </tr>
        );

        return currentRows.map((log) => (
            <tr key={log.id} className="hover:bg-teal-50/40 transition-all duration-300 group">
                <td className="px-8 py-6 whitespace-nowrap text-sm text-gray-700 font-semibold font-sans">
                    {new Date(log.timestamp).toLocaleDateString()} 
                    <span className="text-gray-300 ml-2 font-normal font-sans">
                        {new Date(log.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                    </span>
                </td>
                <td className="px-8 py-6 whitespace-nowrap text-sm font-bold text-teal-700 font-sans">
                    {log.event_class_name || log.type}
                </td>
                <td className="px-8 py-6 whitespace-nowrap text-sm text-gray-500 font-sans">{log.location}</td>
                <td className="px-8 py-6 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                        <FaCircle className={`text-[8px] ${(log.status || '').toLowerCase() === 'unacknowledged' ? 'text-red-500 animate-pulse' : 'text-green-500'}`} />
                        <span className={`text-[11px] font-black uppercase tracking-tight font-sans ${(log.status || '').toLowerCase() === 'unacknowledged' ? 'text-red-600' : 'text-green-600'}`}>
                            {log.status}
                        </span>
                    </div>
                </td>
                <td className="px-8 py-6 whitespace-nowrap text-xs text-gray-400 italic font-medium font-sans">
                    {log.acknowledged_by_username || 'System'}
                </td>
                <td className="px-8 py-6 whitespace-nowrap text-right">
                    <div className="flex items-center justify-end gap-2">
                        {log.snapshot_url ? (
                            <a
                                href={log.snapshot_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="px-3 py-2 text-xs font-bold rounded-xl bg-teal-600 text-white hover:bg-teal-700 transition"
                            >
                                View
                            </a>
                        ) : null}
                        <button className="w-10 h-10 flex items-center justify-center rounded-full text-gray-300 group-hover:bg-teal-600 group-hover:text-white group-hover:shadow-lg transition-all">
                            <FaArrowRight size={14} />
                        </button>
                    </div>
                </td>
            </tr>
        ));
    };

    return (
        <div className="container mx-auto p-8 space-y-8 animate-in fade-in duration-500">
            
            {/* --- TOP BAR --- */}
            <div className="flex flex-col md:flex-row justify-between items-center gap-6">
                <div className="flex items-center gap-4">
                    <div>
                        <h1 className="text-3xl font-extrabold text-gray-800 tracking-tight font-sans">Event Logs</h1>
                        <p className="text-sm font-semibold text-gray-400 uppercase tracking-widest font-sans">{filteredLogs.length} Entries</p>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <div className="relative">
                        <FaSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
                        <input
                            type="text"
                            placeholder="Quick search..."
                            className="pl-11 pr-6 py-3 bg-white border border-gray-200 rounded-2xl focus:ring-4 focus:ring-teal-500/10 focus:border-teal-500 outline-none w-full sm:w-72 text-sm font-medium transition-all shadow-sm font-sans"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(sanitizeSearchInput(e.target.value))}
                        />
                    </div>
                    <button 
                        onClick={() => setShowFilters(!showFilters)}
                        className={`p-3 rounded-2xl border transition-all ${showFilters ? 'bg-teal-600 border-teal-600 text-white shadow-lg' : 'bg-white border-gray-200 text-gray-500'}`}
                    >
                        <FaFilter size={16} />
                    </button>
                </div>
            </div>

            {/* --- FILTER RIBBON --- */}
            {showFilters && (
                <div className="flex flex-col lg:flex-row gap-8 items-start bg-white p-6 rounded-3xl border border-gray-100 shadow-sm animate-in slide-in-from-top-4 duration-500">
                    <div className="flex flex-wrap items-center gap-8 flex-grow">
                        <div className="space-y-2">
                            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1 font-sans">Classification</span>
                            <div className="flex flex-wrap gap-2">
                                {visibleClassifications.map(opt => (
                                    <button
                                        key={opt}
                                        onClick={() => toggleFilter(opt, filterClass, setFilterClass)}
                                        className={`px-4 py-2 rounded-xl text-xs font-bold transition-all font-sans ${filterClass.includes(opt) ? 'bg-teal-600 text-white shadow-md' : 'text-gray-500 bg-gray-50 border border-gray-100'}`}
                                    >
                                        {opt}
                                    </button>
                                ))}
                                {classifications.length > 1 && (
                                    <button
                                        onClick={() => setShowAllClassifications(prev => !prev)}
                                        className="px-3 py-2 rounded-xl text-xs font-black text-gray-500 bg-white border border-gray-200 hover:border-teal-500 hover:text-teal-600 transition-all font-sans"
                                    >
                                        {showAllClassifications ? 'Less' : '...'}
                                    </button>
                                )}
                            </div>
                        </div>

                        <div className="space-y-2">
                            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1 font-sans">Status</span>
                            <div className="flex gap-2">
                                {['unacknowledged', 'acknowledged'].map(opt => (
                                    <button
                                        key={opt}
                                        onClick={() => toggleFilter(opt, filterStatus, setFilterStatus)}
                                        className={`px-4 py-2 rounded-xl text-xs font-bold transition-all capitalize font-sans ${filterStatus.includes(opt) ? 'bg-teal-600 text-white shadow-md' : 'text-gray-500 bg-gray-50 border border-gray-100'}`}
                                    >
                                        {opt}
                                    </button>
                                ))}
                                <button onClick={resetFilters} className="ml-4 p-2 text-gray-400 hover:text-red-500 transition-colors flex items-center gap-2 text-[10px] font-black uppercase tracking-widest font-sans">
                                    <FaTimes size={12} /> Clear All
                                </button>
                            </div>
                        </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-4 lg:border-l lg:border-gray-100 lg:pl-8">
                        <div className="flex items-center bg-gray-50 border border-gray-100 rounded-2xl px-2">
                            <input type="date" value={startDate} onChange={(e) => setStartDate(sanitizeDateInput(e.target.value))} className="p-2 bg-transparent text-xs font-bold text-gray-600 outline-none font-sans" />
                            <span className="text-gray-300">/</span>
                            <input type="date" value={endDate} onChange={(e) => setEndDate(sanitizeDateInput(e.target.value))} className="p-2 bg-transparent text-xs font-bold text-gray-600 outline-none font-sans" />
                        </div>
                        <select value={limit} onChange={(e) => setLimit(sanitizeLimitInput(e.target.value))} className="p-2.5 bg-gray-50 border border-gray-100 rounded-2xl text-xs font-bold text-gray-600 outline-none font-sans">
                            <option value={20}>20 Rows</option>
                            <option value={50}>50 Rows</option>
                            <option value={100}>100 Rows</option>
                            <option value={1000}>1000 Rows</option>
                        </select>
                        <button
                            onClick={handleGenerateReport}
                            className="bg-gray-900 text-white px-5 py-3 rounded-2xl flex items-center gap-2 hover:bg-teal-600 transition-all active:scale-95 font-sans"
                        >
                            <FaDownload size={13} />
                            <span className="text-[10px] font-bold uppercase tracking-widest">Generate Report</span>
                        </button>
                    </div>
                </div>
            )}

            {/* --- DATA TABLE CARD --- */}
            <div className="bg-white rounded-[2.5rem] shadow-2xl shadow-gray-200/40 border border-gray-100 overflow-hidden">
                <table className="min-w-full divide-y divide-gray-100 font-sans">
                    <thead className="bg-gray-50/50">
                        <tr>
                            {['Timestamp', 'Classification', 'Location', 'Status', 'Ack. By', 'Action'].map((head) => (
                                <th key={head} className="px-8 py-5 text-left text-[11px] font-bold text-gray-400 uppercase tracking-widest">{head}</th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50 font-sans">
                        {renderTableBody()}
                    </tbody>
                </table>

                {/* --- PAGINATION FOOTER --- */}
                <div className="bg-gray-50/30 px-8 py-5 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-gray-100 font-sans">
                    <span className="text-[11px] text-gray-400 font-bold uppercase tracking-widest">
                        Showing <span className="text-gray-800">{indexOfFirstRow + 1}</span> - <span className="text-gray-800">{Math.min(indexOfLastRow, filteredLogs.length)}</span> of <span className="text-gray-800">{filteredLogs.length}</span>
                    </span>
                    
                    <div className="flex gap-2">
                        <button disabled={currentPage === 1} onClick={() => setCurrentPage(prev => prev - 1)} className="px-5 py-2.5 rounded-xl border border-gray-200 bg-white text-gray-600 text-[10px] font-black uppercase tracking-widest hover:border-teal-500 disabled:opacity-30 transition-all shadow-sm">
                            Previous
                        </button>
                        <button disabled={currentPage === totalPages || totalPages === 0} onClick={() => setCurrentPage(prev => prev + 1)} className="px-5 py-2.5 rounded-xl border border-gray-200 bg-white text-gray-600 text-[10px] font-black uppercase tracking-widest hover:border-teal-500 disabled:opacity-30 transition-all shadow-sm">
                            Next
                        </button>
                    </div>
                </div>
            </div>

        </div>
    );
}