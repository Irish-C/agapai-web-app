import React, { useState, useEffect } from 'react';
import { 
    FaFileAlt, FaSpinner, FaExclamationTriangle, FaArrowRight, 
    FaSearch, FaTimes, FaCircle, FaDownload, FaFilter 
} from 'react-icons/fa';
import { fetchReportsData } from '../services/apiService';

export default function ReportsPage() {
    // --- STATE MANAGEMENT ---
    const [logs, setLogs] = useState([]);
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

    // Pagination States
    const [currentPage, setCurrentPage] = useState(1);
    const rowsPerPage = 10;

    // --- DATA FETCHING ---
    useEffect(() => {
        const loadReportData = async () => {
            try {
                setIsLoading(true);
                const response = await fetchReportsData(limit, startDate, endDate); 
                const dataArray = response.report || response.data || [];
                if (response.status === 'success' || Array.isArray(dataArray)) {
                    setLogs(dataArray);
                    setCurrentPage(1); // Reset to first page on new data
                }
            } catch (err) {
                setError(err.message);
            } finally {
                setIsLoading(false);
            }
        }; 
        loadReportData(); 
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

    const uniqueClasses = [...new Set(logs.map(log => log.event_class_name || log.type).filter(Boolean))];

    // --- HANDLERS ---
    const toggleFilter = (item, currentArray, setter) => {
        setter(currentArray.includes(item) ? currentArray.filter(i => i !== item) : [...currentArray, item]);
    };

    const resetFilters = () => {
        setSearchTerm(''); setFilterClass([]); setFilterStatus([]); setStartDate(''); setEndDate('');
    };

    const handleFileClick = (filePath) => {
        alert(`Viewing snapshot: ${filePath}`);
    };

    // --- RENDER HELPERS ---
    const renderTableBody = () => {
        if (isLoading) return (
            <tr>
                <td colSpan="6" className="py-20 text-center text-teal-600">
                    <FaSpinner className="animate-spin inline mr-3 text-2xl" />
                    <span className="text-lg font-medium">Syncing Logs...</span>
                </td>
            </tr>
        );

        if (error) return (
            <tr>
                <td colSpan="6" className="py-20 text-center text-red-500 font-medium">
                    <FaExclamationTriangle className="inline mr-2" /> Error: {error}
                </td>
            </tr>
        );

        if (currentRows.length === 0) return (
            <tr>
                <td colSpan="6" className="px-8 py-32 text-center text-gray-400 font-medium italic">
                    No records found for current criteria.
                </td>
            </tr>
        );

        return currentRows.map((log) => (
            <tr key={log.id} className="hover:bg-teal-50/40 transition-all duration-300 group">
                <td className="px-8 py-6 whitespace-nowrap text-sm text-gray-700 font-semibold">
                    {new Date(log.timestamp).toLocaleDateString()} 
                    <span className="text-gray-300 ml-2 font-normal">
                        {new Date(log.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                    </span>
                </td>
                <td className="px-8 py-6 whitespace-nowrap text-sm font-bold text-teal-700">
                    {log.event_class_name || log.type}
                </td>
                <td className="px-8 py-6 whitespace-nowrap text-sm text-gray-500">{log.location}</td>
                <td className="px-8 py-6 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                        <FaCircle className={`text-[8px] ${(log.status || '').toLowerCase() === 'unacknowledged' ? 'text-red-500 animate-pulse' : 'text-green-500'}`} />
                        <span className={`text-[11px] font-black uppercase tracking-tight ${(log.status || '').toLowerCase() === 'unacknowledged' ? 'text-red-600' : 'text-green-600'}`}>
                            {log.status}
                        </span>
                    </div>
                </td>
                <td className="px-8 py-6 whitespace-nowrap text-xs text-gray-400 italic font-medium">
                    {log.acknowledged_by_username || 'System'}
                </td>
                <td className="px-8 py-6 whitespace-nowrap text-right">
                    <button 
                        onClick={() => handleFileClick(log.file_path || log.snapshot_url)}
                        className="w-10 h-10 flex items-center justify-center rounded-full text-gray-300 group-hover:bg-teal-600 group-hover:text-white group-hover:shadow-lg transition-all"
                    >
                        <FaArrowRight size={14} />
                    </button>
                </td>
            </tr>
        ));
    };

    return (
        <div className="container mx-auto p-8 space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-500 font-sans">
            
            {/* --- TOP BAR --- */}
            <div className="flex flex-col md:flex-row justify-between items-center gap-6">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 flex items-center justify-center bg-teal-600 text-white rounded-2xl shadow-lg shadow-teal-100">
                        <FaFileAlt size={20} />
                    </div>
                    <div>
                        <h1 className="text-3xl font-extrabold text-gray-800 tracking-tight">Event Logs</h1>
                        <p className="text-sm font-semibold text-gray-400 uppercase tracking-widest">{filteredLogs.length} Entries Found</p>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <div className="relative group">
                        <FaSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-teal-600 transition-colors" size={14} />
                        <input
                            type="text"
                            placeholder="Quick search..."
                            className="pl-11 pr-6 py-3 bg-white border border-gray-200 rounded-2xl focus:ring-4 focus:ring-teal-500/10 focus:border-teal-500 outline-none w-full sm:w-72 text-sm font-medium transition-all shadow-sm"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <button 
                        onClick={() => setShowFilters(!showFilters)}
                        className={`p-3 rounded-2xl border transition-all shadow-sm ${showFilters ? 'bg-teal-600 border-teal-600 text-white' : 'bg-white border-gray-200 text-gray-500 hover:border-teal-500'}`}
                    >
                        <FaFilter size={16} />
                    </button>
                </div>
            </div>

            {/* --- FILTER RIBBON --- */}
            {showFilters && (
                <div className="flex flex-col lg:flex-row gap-8 items-start animate-in fade-in slide-in-from-top-4 duration-500 bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
                    <div className="flex flex-wrap items-center gap-8 flex-grow">
                        <div className="space-y-2">
                            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Classification</span>
                            <div className="flex flex-wrap gap-2">
                                {uniqueClasses.map(opt => (
                                    <button
                                        key={opt}
                                        onClick={() => toggleFilter(opt, filterClass, setFilterClass)}
                                        className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${filterClass.includes(opt) ? 'bg-teal-600 text-white shadow-md' : 'text-gray-500 bg-gray-50 border border-gray-100'}`}
                                    >
                                        {opt}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="space-y-2">
                            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Status</span>
                            <div className="flex gap-2">
                                {['unacknowledged', 'acknowledged'].map(opt => (
                                    <button
                                        key={opt}
                                        onClick={() => toggleFilter(opt, filterStatus, setFilterStatus)}
                                        className={`px-4 py-2 rounded-xl text-xs font-bold transition-all capitalize ${filterStatus.includes(opt) ? 'bg-teal-600 text-white shadow-md' : 'text-gray-500 bg-gray-50 border border-gray-100'}`}
                                    >
                                        {opt}
                                    </button>
                                ))}
                                <button 
                                    onClick={resetFilters}
                                    className="ml-4 p-2 text-gray-400 hover:text-red-500 transition-colors flex items-center gap-2 text-[10px] font-black uppercase tracking-widest"
                                >
                                    <FaTimes size={12} /> Clear All
                                </button>
                            </div>
                        </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-4 lg:border-l lg:border-gray-100 lg:pl-8">
                        <div className="flex items-center bg-gray-50 border border-gray-100 rounded-2xl px-2">
                            <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="p-2 bg-transparent text-xs font-bold text-gray-600 outline-none" />
                            <span className="text-gray-300">/</span>
                            <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="p-2 bg-transparent text-xs font-bold text-gray-600 outline-none" />
                        </div>
                        <select value={limit} onChange={(e) => setLimit(Number(e.target.value))} className="p-2.5 bg-gray-50 border border-gray-100 rounded-2xl text-xs font-bold text-gray-600 outline-none cursor-pointer">
                            <option value={20}>20 Rows</option>
                            <option value={50}>50 Rows</option>
                            <option value={100}>100 Rows</option>
                        </select>
                    </div>
                </div>
            )}

            {/* --- DATA TABLE CARD --- */}
            <div className="bg-white rounded-[2.5rem] shadow-2xl shadow-gray-200/40 border border-gray-100 overflow-hidden">
                <table className="min-w-full divide-y divide-gray-100">
                    <thead className="bg-gray-50/50">
                        <tr>
                            {['Timestamp', 'Classification', 'Location', 'Status', 'Ack. By', 'Action'].map((head) => (
                                <th key={head} className="px-8 py-5 text-left text-[11px] font-bold text-gray-400 uppercase tracking-widest">{head}</th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                        {renderTableBody()}
                    </tbody>
                </table>

                {/* --- PAGINATION FOOTER --- */}
                <div className="bg-gray-50/30 px-8 py-5 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-gray-100">
                    <span className="text-[11px] text-gray-400 font-bold uppercase tracking-widest">
                        Showing <span className="text-gray-800">{indexOfFirstRow + 1}</span> - <span className="text-gray-800">{Math.min(indexOfLastRow, filteredLogs.length)}</span> of <span className="text-gray-800">{filteredLogs.length}</span>
                    </span>
                    
                    <div className="flex gap-2">
                        <button 
                            disabled={currentPage === 1}
                            onClick={() => setCurrentPage(prev => prev - 1)}
                            className="px-5 py-2.5 rounded-xl border border-gray-200 bg-white text-gray-600 text-[10px] font-black uppercase tracking-widest hover:border-teal-500 disabled:opacity-30 disabled:cursor-not-allowed transition-all shadow-sm"
                        >
                            Previous
                        </button>
                        <button 
                            disabled={currentPage === totalPages || totalPages === 0}
                            onClick={() => setCurrentPage(prev => prev + 1)}
                            className="px-5 py-2.5 rounded-xl border border-gray-200 bg-white text-gray-600 text-[10px] font-black uppercase tracking-widest hover:border-teal-500 disabled:opacity-30 disabled:cursor-not-allowed transition-all shadow-sm"
                        >
                            Next
                        </button>
                    </div>
                </div>
            </div>

            {/* --- FLOATING EXPORT BUTTON --- */}
            <button 
                onClick={() => alert("Exporting formatted report...")}
                className="fixed bottom-8 right-8 bg-gray-900 text-white px-7 py-4 rounded-2xl shadow-2xl flex items-center gap-3 hover:bg-teal-600 hover:-translate-y-1 transition-all active:scale-95 z-50"
            >
                <FaDownload size={14} />
                <span className="text-[11px] font-bold uppercase tracking-widest">Generate Report</span>
            </button>
        </div>
    );
}