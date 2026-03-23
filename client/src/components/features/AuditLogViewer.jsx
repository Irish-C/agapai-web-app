import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { socket } from '../../services/socket';
import { useUserFeatures } from '../../hooks/useUserFeatures.js';
import './AuditLogViewer.css';

/**
 * AuditLogViewer Component
 * Displays a paginated audit log of all permission changes
 */
export default function AuditLogViewer() {
  const { hasFeature } = useUserFeatures();
  // STATE
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(25);
  const [totalLogs, setTotalLogs] = useState(0);
  const [filters, setFilters] = useState({
    roleId: '',
    permissionName: '',
  });
  const [message, setMessage] = useState({ type: '', text: '' });

  // FETCH LOGS ON MOUNT AND WHEN FILTERS/PAGE CHANGE
  // Only fetch if user has permission
  useEffect(() => {
    if (hasFeature('view_audit_log')) {
      fetchAuditLogs();
    }
  }, [page, limit, filters, hasFeature]);

  // LISTEN FOR REAL-TIME AUDIT LOG ENTRIES
  useEffect(() => {
    socket.on('audit_log_entry', handleNewAuditEntry);

    return () => {
      socket.off('audit_log_entry', handleNewAuditEntry);
    };
  }, []);

  // API: FETCH AUDIT LOGS
  const fetchAuditLogs = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      params.append('limit', limit);
      params.append('offset', (page - 1) * limit);

      if (filters.roleId) {
        params.append('role_id', filters.roleId);
      }
      if (filters.permissionName) {
        params.append('permission_name', filters.permissionName);
      }

      const response = await axios.get(`http://127.0.0.1:5000/api/admin/permissions/audit-log?${params.toString()}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('authToken')}` },
      });

      setLogs(response.data);
      // Estimate total from response (would need backend support for exact count)
      setTotalLogs(response.data.length > 0 ? (page - 1) * limit + response.data.length + limit : 0);

      setMessage({ type: 'success', text: `Loaded ${response.data.length} audit entries` });
    } catch (err) {
      setMessage({ type: 'error', text: 'Failed to load audit logs' });
      console.error('Error fetching audit logs:', err);
    } finally {
      setLoading(false);
    }
  };

  // HANDLE: NEW AUDIT ENTRY VIA WEBSOCKET
  const handleNewAuditEntry = (data) => {
    console.log('New audit log entry:', data);
    // Prepend new entry to the list, only trim if it exceeds the limit
    setLogs((prevLogs) => {
      const updated = [data, ...prevLogs];
      // Only remove the oldest item if the list exceeds the limit
      // This prevents entries from disappearing unless absolutely necessary
      return updated.length > limit ? updated.slice(0, limit) : updated;
    });
    setMessage({
      type: 'info',
      text: `${data.role_name}.${data.permission_name} changed by ${data.changed_by_username}`,
    });
  };

  // HANDLE: FILTER CHANGE
  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters({ ...filters, [name]: value });
    setPage(1); // Reset to page 1 when filters change
  };

  // HANDLE: RESET FILTERS
  const handleResetFilters = () => {
    setFilters({ roleId: '', permissionName: '' });
    setPage(1);
  };

  // PAGINATION
  const totalPages = Math.ceil(totalLogs / limit);

  // RENDER UTILITY: Format datetime
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
  };

  // RENDER UTILITY: Permission change badge
  const getChangeBadge = (oldValue, newValue) => {
    if (oldValue === null) {
      return (
        <span className="change-badge change-created">
          Created: {newValue ? '✓ Allowed' : '✗ Denied'}
        </span>
      );
    }

    if (oldValue === newValue) {
      return <span className="change-badge change-unchanged">Unchanged</span>;
    }

    if (oldValue && !newValue) {
      return <span className="change-badge change-disabled">✗ Disabled</span>;
    }

    if (!oldValue && newValue) {
      return <span className="change-badge change-enabled">✓ Enabled</span>;
    }
  };

  // Check if user has permission to view audit logs
  if (!hasFeature('view_audit_log')) {
    return (
      <div className="audit-log-viewer">
        <div className="alv-header">
          <h2>Permission Audit Log</h2>
          <p>Track all changes to role permissions with timestamps and reasons</p>
        </div>
        <div className="alv-message alv-message-error">
          You don't have permission to view the audit log.
        </div>
      </div>
    );
  }

  // RENDER
  return (
    <div className="audit-log-viewer">
      <div className="alv-header">
        <h2>Permission Audit Log</h2>
        <p>Track all changes to role permissions with timestamps and reasons</p>
      </div>

      {/* MESSAGE DISPLAY */}
      {message.text && (
        <div className={`alv-message alv-message-${message.type}`}>
          {message.text}
        </div>
      )}

      {/* FILTERS */}
      <div className="alv-filters">
        <input
          type="text"
          name="roleId"
          placeholder="Filter by role name..."
          value={filters.roleId}
          onChange={handleFilterChange}
          className="filter-input"
        />
        <input
          type="text"
          name="permissionName"
          placeholder="Filter by permission..."
          value={filters.permissionName}
          onChange={handleFilterChange}
          className="filter-input"
        />
        <select
          value={limit}
          onChange={(e) => {
            setLimit(parseInt(e.target.value));
            setPage(1);
          }}
          className="filter-select"
        >
          <option value={10}>10 per page</option>
          <option value={25}>25 per page</option>
          <option value={50}>50 per page</option>
          <option value={100}>100 per page</option>
        </select>
        <button
          onClick={handleResetFilters}
          className="btn btn-outline btn-sm"
          disabled={!filters.roleId && !filters.permissionName}
        >
          Clear Filters
        </button>
      </div>

      {/* LOGS TABLE */}
      <div className="alv-table-container">
        {loading ? (
          <div className="alv-loading">Loading audit logs...</div>
        ) : logs.length === 0 ? (
          <div className="alv-empty">
            <p>No audit log entries found</p>
          </div>
        ) : (
          <table className="alv-table">
            <thead>
              <tr>
                <th>Role</th>
                <th>Permission</th>
                <th>Change</th>
                <th>Changed By</th>
                <th>Timestamp</th>
                <th>Reason</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log, idx) => (
                <tr key={`${log.id}-${idx}`} className="alv-row">
                  <td className="col-role">
                    <span className="badge badge-role">{log.role_name}</span>
                  </td>
                  <td className="col-permission">{log.permission_name}</td>
                  <td className="col-change">{getChangeBadge(log.old_value, log.new_value)}</td>
                  <td className="col-user">{log.changed_by_username}</td>
                  <td className="col-timestamp">{formatDate(log.changed_at)}</td>
                  <td className="col-reason">
                    {log.reason ? (
                      <span className="reason-text">{log.reason}</span>
                    ) : (
                      <span className="reason-empty">—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* PAGINATION */}
      {totalPages > 1 && (
        <div className="alv-pagination">
          <button
            onClick={() => setPage(Math.max(1, page - 1))}
            disabled={page === 1}
            className="btn btn-outline btn-sm"
          >
            ← Previous
          </button>

          <div className="page-info">
            Page {page} of {totalPages}
          </div>

          <button
            onClick={() => setPage(Math.min(totalPages, page + 1))}
            disabled={page === totalPages}
            className="btn btn-outline btn-sm"
          >
            Next →
          </button>
        </div>
      )}
    </div>
  );
}
