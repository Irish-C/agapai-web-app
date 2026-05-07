// src/pages/ReportsPage.jsx

import React, { useState, useEffect } from 'react';
import { 
    FaFileAlt, FaSpinner, FaExclamationTriangle, FaEllipsisV, 
    FaSearch, FaTimes, FaCircle, FaDownload, FaFilter, FaTrash,
    FaCopy
} from 'react-icons/fa';
import { fetchReportsData, fetchApi } from '../services/apiService';
import SnapshotGallery from '../components/SnapshotGallery';

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
    const [rowActionLoading, setRowActionLoading] = useState({});
    const [openMenuLogId, setOpenMenuLogId] = useState(null);

    // Gallery States
    const [galleryOpen, setGalleryOpen] = useState(false);
    const [gallerySnapshots, setGallerySnapshots] = useState([]);
    const [galleryTitle, setGalleryTitle] = useState('');

    // Pagination States
    const [currentPage, setCurrentPage] = useState(1);
    const rowsPerPage = 10;

    // Details Modal & Copy Notification States
    const [detailsModal, setDetailsModal] = useState({ open: false, event: null });
    const [copyNotification, setCopyNotification] = useState(null);

    const normalizeDateRange = (start, end) => {
        if (!start || !end) return { start, end };
        return start <= end
            ? { start, end }
            : { start: end, end: start };
    };

    // --- HELPER: Format timestamp (handles both numeric ms and string ISO formats) ---
    // Uses system local timezone and locale settings for display
    const formatTimestamp = (timestamp) => {
        if (!timestamp) return '';
        
        let date;
        if (typeof timestamp === 'number') {
            // Numeric timestamp in milliseconds - already in UTC, will be converted to local time
            date = new Date(timestamp);
        } else if (typeof timestamp === 'string') {
            // String format - try to parse
            date = new Date(timestamp);
        } else {
            return '';
        }
        
        if (isNaN(date.getTime())) return '';
        
        // Use system's local timezone and locale for formatting
        return date.toLocaleString('en-US', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: false  // Use 24-hour format
        });
    };

    // --- DATA FETCHING ---
    useEffect(() => {
        const loadPageData = async () => {
            try {
                setIsLoading(true);
                
                // Fetch Logs and Classifications in parallel for speed
                const normalizedRange = normalizeDateRange(startDate, endDate);

                const [logResponse, classResponse] = await Promise.all([
                    fetchReportsData(limit, normalizedRange.start, normalizedRange.end),
                    fetchApi('/event-types', 'GET') // Fetches dynamic types from database
                ]);

                // Handle Logs
                const dataArray = logResponse.report || logResponse.data || [];
                if (logResponse.status === 'success' || Array.isArray(dataArray)) {
                    setLogs(dataArray);
                }

                // Only use classifications that exist in the database (EventClass table)
                const dbClassifications = Array.isArray(classResponse)
                    ? classResponse.map(c => c.name || c.type).filter(Boolean)
                    : [];

                setClassifications(prev => dbClassifications.length > 0 ? dbClassifications : prev);

                setCurrentPage(1); 
            } catch (err) {
                setError(err.message);
            } finally {
                setIsLoading(false);
            }
        }; 
        loadPageData(); 
    }, [limit, startDate, endDate]);

    // --- CLOSE KEBAB MENU ON OUTSIDE CLICK ---
    useEffect(() => {
        const handleClickOutside = () => setOpenMenuLogId(null);
        if (openMenuLogId !== null) {
            document.addEventListener('click', handleClickOutside);
            return () => document.removeEventListener('click', handleClickOutside);
        }
    }, [openMenuLogId]);

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

    const handleStartDateChange = (value) => {
        const nextStart = sanitizeDateInput(value);
        if (!nextStart) {
            setStartDate('');
            return;
        }

        if (endDate && nextStart > endDate) {
            setStartDate(endDate);
            setEndDate(nextStart);
            return;
        }

        setStartDate(nextStart);
    };

    const handleEndDateChange = (value) => {
        const nextEnd = sanitizeDateInput(value);
        if (!nextEnd) {
            setEndDate('');
            return;
        }

        if (startDate && nextEnd < startDate) {
            setEndDate(startDate);
            setStartDate(nextEnd);
            return;
        }

        setEndDate(nextEnd);
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
            const formattedTs = formatTimestamp(log.timestamp);
            const timestamp = formattedTs || '';  // formatTimestamp already returns a formatted string
            const classification = log.event_class_name || log.type || '';
            const location = log.location || '';
            const status = log.status || '';
            const acknowledgedBy = (log.status || '').toLowerCase() === 'acknowledged'
                ? (log.acknowledged_by_username || 'Unknown User')
                : '';
            const snapshotUrl = log.snapshot_url || '';

            return [timestamp, classification, location, status, acknowledgedBy, snapshotUrl]
                .map(escapeCsv)
                .join(',');
        });

        const csvContent = [headers.join(','), ...rows].join('\n');
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        const now = new Date();
        const timestamp = `${now.getFullYear()}-${(now.getMonth()+1).toString().padStart(2, '0')}-${now.getDate().toString().padStart(2, '0')}T${now.getHours().toString().padStart(2, '0')}-${now.getMinutes().toString().padStart(2, '0')}-${now.getSeconds().toString().padStart(2, '0')}`;

        link.href = url;
        link.download = `event_report_${timestamp}.csv`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    };

    const getCurrentUsername = () => {
        try {
            const rawUser = localStorage.getItem('user');
            if (!rawUser) return 'Current User';
            const parsedUser = JSON.parse(rawUser);
            return parsedUser?.username || 'Current User';
        } catch {
            return 'Current User';
        }
    };

    const handleToggleAcknowledge = async (log) => {
        const logId = log?.id;
        if (!logId) {
            setError('Cannot update status: invalid log ID.');
            return;
        }

        const currentStatus = (log.status || '').toLowerCase();
        const currentUser = getCurrentUsername().toLowerCase();
        const acknowledgedBy = (log.acknowledged_by_username || '').toLowerCase();

        if (currentStatus === 'acknowledged' && acknowledgedBy && acknowledgedBy !== currentUser) {
            setError('Only the user who acknowledged this event can unacknowledge it.');
            return;
        }

        const willAcknowledge = currentStatus !== 'acknowledged';
        const endpoint = willAcknowledge
            ? `/events/${logId}/acknowledge`
            : `/events/${logId}/unacknowledge`;

        try {
            setRowActionLoading(prev => ({ ...prev, [logId]: true }));
            setError(null);

            const response = await fetchApi(endpoint, 'POST');
            console.log('[ReportsPage] Full status update response:', response, 'endpoint:', endpoint);
            console.log('[ReportsPage] Response type:', typeof response);
            console.log('[ReportsPage] Response keys:', response ? Object.keys(response) : 'null');
            
            // Check for success - very flexible validation
            const isSuccess = response && (response.status === 'success' || response.message?.includes('Event'));
            console.log('[ReportsPage] Is success?', isSuccess, 'willAcknowledge?', willAcknowledge);
            
            if (!isSuccess) {
                throw new Error(response?.message || 'Status update failed.');
            }

            console.log('[ReportsPage] Updating state for log', logId, 'Action:', willAcknowledge ? 'acknowledge' : 'unacknowledge');
            setLogs(prevLogs => {
                const updated = prevLogs.map(item => {
                    if (String(item.id) !== String(logId)) return item;

                    const updatedItem = {
                        ...item,
                        status: willAcknowledge ? 'acknowledged' : 'unacknowledged',
                        event_status: willAcknowledge ? 'acknowledged' : 'unacknowledged',
                        acknowledged_by_username: willAcknowledge ? getCurrentUsername() : null,
                    };
                    console.log('[ReportsPage] Updated log item:', updatedItem);
                    return updatedItem;
                });
                console.log('[ReportsPage] Updated logs list, total:', updated.length);
                return updated;
            });
        } catch (err) {
            console.error('[ReportsPage] Error updating status:', err);
            setError(err.message || 'Failed to update acknowledgment status.');
        } finally {
            setRowActionLoading(prev => ({ ...prev, [logId]: false }));
        }
    };

    const handleDeleteEvent = async (log) => {
        const logId = log?.id;
        if (!logId) {
            setError('Cannot delete: invalid log ID.');
            return;
        }

        // Confirmation dialog
        if (!window.confirm(`Delete this event (${log.event_class_name || log.type})? This action cannot be undone.`)) {
            return;
        }

        try {
            setRowActionLoading(prev => ({ ...prev, [logId]: true }));
            setError(null);

            const response = await fetchApi(`/events/${logId}`, 'DELETE');

            // Validate response
            if (!response || (response.status !== 'success' && !response.message)) {
                throw new Error('Delete failed: no response from server');
            }

            // Optimistic UI update - remove from state immediately
            setLogs(prevLogs => prevLogs.filter(item => String(item.id) !== String(logId)));
            
        } catch (err) {
            console.error('[ReportsPage] Error deleting event:', err);
            setError(err.message || 'Failed to delete event.');
        } finally {
            setRowActionLoading(prev => ({ ...prev, [logId]: false }));
        }
    };

    const openGallery = (log) => {
        let snapshots = [];

        // Parse accumulated snapshot data
        if (log.all_snapshots && Array.isArray(log.all_snapshots)) {
            snapshots = log.all_snapshots;
        } else if (log.snapshot_url) {
            snapshots = [log.snapshot_url];
        }

        if (snapshots.length > 0) {
            const occurrenceText = log.occurrence_count && log.occurrence_count > 1 
                ? ` (${log.occurrence_count} occurrences)`
                : '';
            setGalleryTitle(`${log.type || 'Event'}${occurrenceText}`);
            setGallerySnapshots(snapshots);
            setGalleryOpen(true);
        }
    };

    const handleCopyEventId = (logId) => {
        const text = String(logId);
        
        // Try modern clipboard API first
        if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(text).then(() => {
                setCopyNotification(`Event ID ${logId} copied!`);
                setTimeout(() => setCopyNotification(null), 2000);
            }).catch(() => {
                // Fallback to textarea method
                fallbackCopy(text, logId);
            });
        } else {
            // Fallback for browsers without clipboard API
            fallbackCopy(text, logId);
        }
    };

    const fallbackCopy = (text, logId) => {
        const textarea = document.createElement('textarea');
        textarea.value = text;
        textarea.style.position = 'fixed';
        textarea.style.opacity = '0';
        document.body.appendChild(textarea);
        textarea.select();
        
        try {
            document.execCommand('copy');
            setCopyNotification(`Event ID ${logId} copied!`);
            setTimeout(() => setCopyNotification(null), 2000);
        } catch (err) {
            setError('Failed to copy Event ID');
        } finally {
            document.body.removeChild(textarea);
        }
    };

    const handleViewDetails = (log) => {
        setDetailsModal({ open: true, event: log });
    };

    const renderTableBody = () => {
        if (isLoading) return (
            <tr>
                <td colSpan="6" className="py-20 text-center text-teal-600">
                    <FaSpinner className="animate-spin inline mr-3 text-2xl" />
                    <span className="text-lg font-medium">Loading Event Logs...</span>
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
            (() => {
                const status = (log.status || '').toLowerCase();
                const currentUser = getCurrentUsername().toLowerCase();
                const acknowledgedBy = (log.acknowledged_by_username || '').toLowerCase();
                const canToggle = status !== 'acknowledged' || !acknowledgedBy || acknowledgedBy === currentUser;
                const isToggleDisabled = !!rowActionLoading[log.id] || !canToggle;

                return (
            <tr key={log.id} className="hover:bg-gray-50 transition-all duration-300 group">
                <td className="px-8 py-6 whitespace-nowrap text-sm text-gray-700 font-semibold font-sans">
                    {(() => {
                        const formatted = formatTimestamp(log.timestamp);
                        // Format is "MM/DD/YYYY, HH:MM:SS"
                        const parts = formatted.split(', ');
                        const date = parts[0] || '---';
                        const time = parts[1] || '---';
                        return (
                            <>
                                {date}
                                <span className="text-gray-500 ml-2 font-normal font-sans">
                                    {time}
                                </span>
                            </>
                        );
                    })()}
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
                    {(log.status || '').toLowerCase() === 'acknowledged' && log.acknowledged_by_username
                        ? log.acknowledged_by_username
                        : ''}
                </td>
                <td className="px-8 py-6 whitespace-nowrap text-right">
                    <div className="flex items-center justify-end gap-2">
                        <button
                            onClick={() => handleToggleAcknowledge(log)}
                            disabled={isToggleDisabled}
                            title={!canToggle ? 'Only the user who acknowledged can unacknowledge this event.' : ''}
                            className={`px-3 py-2 text-xs font-bold rounded-xl transition ${
                                isToggleDisabled
                                    ? 'bg-gray-300 text-gray-600 cursor-not-allowed opacity-60'
                                    : ((log.status || '').toLowerCase() === 'acknowledged'
                                        ? 'bg-emerald-600 text-white hover:bg-emerald-700 cursor-pointer'
                                        : 'bg-amber-500 text-white hover:bg-amber-600 cursor-pointer')
                            }`}
                        >
                            {rowActionLoading[log.id]
                                ? 'Saving...'
                                : ((log.status || '').toLowerCase() === 'acknowledged' ? 'Unack' : 'Acknowledge')}
                        </button>
                        {log.snapshot_url ? (
                            <div className="flex items-center gap-2">
                                {log.occurrence_count && log.occurrence_count > 1 && (
                                    <span className="px-2 py-1 text-xs font-bold rounded-full bg-orange-100 text-orange-700">
                                        {log.occurrence_count}x
                                    </span>
                                )}
                                <button
                                    onClick={() => openGallery(log)}
                                    className="px-3 py-2 text-xs font-bold rounded-xl bg-teal-600 text-white hover:bg-teal-700 transition"
                                >
                                    View
                                </button>
                            </div>
                        ) : null}
                        <div className="relative">
                            <button
                                type="button"
                                aria-label="More actions"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setOpenMenuLogId(openMenuLogId === log.id ? null : log.id);
                                }}
                                className="w-10 h-10 flex items-center justify-center rounded-full text-gray-400 hover:bg-gray-200 hover:text-gray-700 transition-all"
                            >
                                <FaEllipsisV size={14} />
                            </button>
                            {openMenuLogId === log.id && (
                                <div className="absolute right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50 min-w-[180px]">
                                    <button
                                        onClick={() => {
                                            handleViewDetails(log);
                                            setOpenMenuLogId(null);
                                        }}
                                        className="w-full text-left px-4 py-2 text-xs font-semibold text-teal-600 hover:bg-teal-50 transition flex items-center gap-2"
                                    >
                                        <FaFileAlt size={12} />
                                        View Details
                                    </button>
                                    <button
                                        onClick={() => {
                                            handleCopyEventId(log.id);
                                            setOpenMenuLogId(null);
                                        }}
                                        className="w-full text-left px-4 py-2 text-xs font-semibold text-blue-600 hover:bg-blue-50 transition flex items-center gap-2 border-t border-gray-100"
                                    >
                                        <FaCopy size={12} />
                                        Copy Event ID
                                    </button>
                                    <button
                                        onClick={() => {
                                            handleDeleteEvent(log);
                                            setOpenMenuLogId(null);
                                        }}
                                        disabled={!!rowActionLoading[log.id]}
                                        className="w-full text-left px-4 py-2 text-xs font-semibold text-red-600 hover:bg-red-50 transition flex items-center gap-2 border-t border-gray-100 disabled:opacity-60 disabled:cursor-not-allowed"
                                    >
                                        <FaTrash size={12} />
                                        {rowActionLoading[log.id] ? 'Deleting...' : 'Delete Event'}
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </td>
            </tr>
                );
            })()
        ));
    };

    return (
        <div className="container mx-auto p-8 space-y-8 animate-in fade-in duration-500">
            
            {/* --- COPY NOTIFICATION TOAST --- */}
            {copyNotification && (
                <div className="fixed top-4 right-4 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg animate-in fade-in duration-300 z-50">
                    {copyNotification}
                </div>
            )}
            
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
                            <input type="date" value={startDate} onChange={(e) => handleStartDateChange(e.target.value)} className="p-2 bg-transparent text-xs font-bold text-gray-600 outline-none font-sans" />
                            <span className="text-gray-300">/</span>
                            <input type="date" value={endDate} onChange={(e) => handleEndDateChange(e.target.value)} className="p-2 bg-transparent text-xs font-bold text-gray-600 outline-none font-sans" />
                        </div>
                        <select value={limit} onChange={(e) => setLimit(sanitizeLimitInput(e.target.value))} className="p-2.5 bg-gray-50 border border-gray-100 rounded-2xl text-xs font-bold text-gray-600 outline-none font-sans">
                            <option value={20}>20 Rows</option>
                            <option value={50}>50 Rows</option>
                            <option value={100}>100 Rows</option>
                            <option value={1000}>1000 Rows</option>
                            <option value={5000}>5000 Rows</option>
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
                <div className="overflow-x-auto">
                <table className="min-w-[900px] w-full divide-y divide-gray-100 font-sans">
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
                </div>

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

            {/* --- SNAPSHOT GALLERY MODAL --- */}
            <SnapshotGallery
                isOpen={galleryOpen}
                onClose={() => setGalleryOpen(false)}
                snapshots={gallerySnapshots}
                title={galleryTitle}
            />

            {/* --- EVENT DETAILS MODAL --- */}
            {detailsModal.open && detailsModal.event && (
                <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setDetailsModal({ open: false, event: null })}>
                    <div className="bg-white rounded-3xl shadow-2xl max-w-6xl w-full max-h-screen overflow-y-auto" onClick={(e) => e.stopPropagation()}>
                        {/* Header */}
                        <div className="sticky top-0 bg-gradient-to-r from-teal-600 to-teal-700 text-white px-8 py-5 flex items-center justify-between border-b border-teal-800">
                            <h2 className="text-2xl font-bold">Event Details</h2>
                            <button
                                onClick={() => setDetailsModal({ open: false, event: null })}
                                className="p-2 hover:bg-teal-500 rounded-full transition-all"
                            >
                                <FaTimes size={20} />
                            </button>
                        </div>

                        {/* Content */}
                        <div className="p-6 space-y-5">
                            <div className="grid grid-cols-2 gap-5">
                                <div>
                                    <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Event ID</span>
                                    <p className="text-lg font-bold text-gray-800 mt-1">{detailsModal.event.id}</p>
                                </div>
                                <div>
                                    <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Classification</span>
                                    <p className="text-lg font-bold text-teal-700 mt-1">{detailsModal.event.event_class_name || detailsModal.event.type}</p>
                                </div>
                                <div>
                                    <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Location</span>
                                    <p className="text-lg font-bold text-gray-800 mt-1">{detailsModal.event.location || 'N/A'}</p>
                                </div>
                                <div>
                                    <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Status</span>
                                    <div className="mt-1 flex items-center gap-2">
                                        <FaCircle className={`${ (detailsModal.event.status || '').toLowerCase() === 'unacknowledged' ? 'text-red-500' : 'text-green-500'}`} size={12} />
                                        <span className={`font-bold uppercase text-sm ${ (detailsModal.event.status || '').toLowerCase() === 'unacknowledged' ? 'text-red-600' : 'text-green-600'}`}>
                                            {detailsModal.event.status}
                                        </span>
                                    </div>
                                </div>
                                <div className="col-span-2">
                                    <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Timestamp</span>
                                    <p className="text-lg font-bold text-gray-800 mt-1">{formatTimestamp(detailsModal.event.timestamp)}</p>
                                </div>
                                {(detailsModal.event.status || '').toLowerCase() === 'acknowledged' && (
                                    <div className="col-span-2">
                                        <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Acknowledged By</span>
                                        <p className="text-lg font-bold text-gray-800 mt-1">{detailsModal.event.acknowledged_by_username || 'N/A'}</p>
                                    </div>
                                )}
                                {detailsModal.event.occurrence_count && (
                                    <div>
                                        <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Occurrences</span>
                                        <p className="text-lg font-bold text-orange-600 mt-1">{detailsModal.event.occurrence_count}</p>
                                    </div>
                                )}
                            </div>

                            {/* Snapshots Grid */}
                            {detailsModal.event.all_snapshots && detailsModal.event.all_snapshots.length > 0 && (
                                <div className="border-t pt-5">
                                    <h3 className="text-sm font-bold text-gray-600 uppercase tracking-widest mb-4">Snapshots ({detailsModal.event.all_snapshots.length})</h3>
                                    <div className="grid grid-cols-2 gap-4">
                                        {detailsModal.event.all_snapshots.map((snapshot, idx) => (
                                            <img key={idx} src={snapshot.startsWith('http') ? snapshot : `/api/snapshots/${snapshot}`} alt={`Snapshot ${idx + 1}`} className="w-full h-56 object-cover rounded-lg border border-gray-200 hover:border-teal-500 transition-all cursor-pointer" />
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

        </div>
    );
}