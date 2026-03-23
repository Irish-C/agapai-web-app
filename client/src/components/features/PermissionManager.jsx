import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { socket } from '../../services/socket';
import './PermissionManager.css';

/**
 * PermissionManager Component
 * Allows superadmin to configure:
 * 1. Role permissions (grant/deny specific actions)
 * 2. Category permissions (visibility and functions for settings tabs)
 */
export default function PermissionManager() {
  // STATE
  const [roles, setRoles] = useState([]);
  const [selectedRole, setSelectedRole] = useState(null);
  const [permissions, setPermissions] = useState({});
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [changes, setChanges] = useState({}); // Track unsaved changes
  const [bulkMode, setBulkMode] = useState(false);
  
  // Category permissions state
  const [activeTab, setActiveTab] = useState('permissions'); // 'permissions' or 'categories'
  const [categories, setCategories] = useState([]);
  const [categoryPermissions, setCategoryPermissions] = useState({});
  const [categoryChanges, setCategoryChanges] = useState({});

  // FETCH ROLES ON MOUNT
  useEffect(() => {
    fetchRoles();
    fetchCategories();
  }, []);

  useEffect(() => {
    // Listen for real-time permission updates
    socket.on('permissions_updated', handlePermissionsUpdated);
    socket.on('permissions_changed', handlePermissionsChanged);

    return () => {
      socket.off('permissions_updated', handlePermissionsUpdated);
      socket.off('permissions_changed', handlePermissionsChanged);
    };
  }, [selectedRole]);

  // API: FETCH ALL ROLES
  const fetchRoles = async () => {
    try {
      setLoading(true);
      const response = await axios.get('http://127.0.0.1:5000/api/admin/permissions/roles', {
        headers: { Authorization: `Bearer ${localStorage.getItem('authToken')}` },
      });
      setRoles(response.data);
      setMessage({ type: 'success', text: 'Roles loaded' });
    } catch (err) {
      setMessage({ type: 'error', text: 'Failed to load roles' });
      console.error('Error fetching roles:', err);
    } finally {
      setLoading(false);
    }
  };

  // API: FETCH ALL CATEGORIES
  const fetchCategories = async () => {
    try {
      const response = await axios.get('http://127.0.0.1:5000/api/admin/permissions/categories', {
        headers: { Authorization: `Bearer ${localStorage.getItem('authToken')}` },
      });
      setCategories(response.data || []);
    } catch (err) {
      console.error('Error fetching categories:', err);
      // This is not critical - categories endpoint might not exist yet
    }
  };

  // API: FETCH CATEGORY PERMISSIONS FOR ROLE
  const fetchCategoryPermissions = async (roleId) => {
    try {
      const response = await axios.get(
        `http://127.0.0.1:5000/api/admin/permissions/categories/${roleId}`,
        { headers: { Authorization: `Bearer ${localStorage.getItem('authToken')}` } }
      );
      
      const perms = {};
      if (response.data.categories) {
        Object.entries(response.data.categories).forEach(([key, cat]) => {
          perms[key] = {
            categoryId: cat.category_id,
            categoryName: cat.category_name,
            isVisible: cat.is_visible,
            allowedFunctions: cat.allowed_functions || [],
          };
        });
      }
      setCategoryPermissions(perms);
      setCategoryChanges({});
    } catch (err) {
      console.error('Error fetching category permissions:', err);
    }
  };

  // API: FETCH SINGLE ROLE PERMISSIONS
  const handleRoleSelect = async (roleId) => {
    try {
      setLoading(true);
      setSelectedRole(roleId);
      
      const response = await axios.get(`http://127.0.0.1:5000/api/admin/permissions/roles/${roleId}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('authToken')}` },
      });
      setPermissions(response.data.permissions);
      setChanges({});
      
      // Also fetch category permissions
      await fetchCategoryPermissions(roleId);
      
      setMessage({ type: 'success', text: `Loaded permissions for ${response.data.role_name}` });
    } catch (err) {
      setMessage({ type: 'error', text: 'Failed to load permissions' });
      console.error('Error fetching permissions:', err);
    } finally {
      setLoading(false);
    }
  };

  // HANDLE: SINGLE PERMISSION TOGGLE
  const handlePermissionToggle = (permissionName) => {
    const newPermissions = { ...permissions };
    newPermissions[permissionName] = !permissions[permissionName];
    setPermissions(newPermissions);

    // Track change
    setChanges({
      ...changes,
      [permissionName]: newPermissions[permissionName],
    });

    setMessage({ type: 'info', text: `${permissionName}: ${newPermissions[permissionName] ? 'enabled' : 'disabled'}` });
  };

  // HANDLE: ENABLE ALL
  const handleEnableAll = () => {
    const newPermissions = {};
    const newChanges = {};
    Object.keys(permissions).forEach((perm) => {
      newPermissions[perm] = true;
      newChanges[perm] = true;
    });
    setPermissions(newPermissions);
    setChanges(newChanges);
    setMessage({ type: 'info', text: 'All permissions enabled' });
  };

  // HANDLE: DISABLE ALL
  const handleDisableAll = () => {
    const newPermissions = {};
    const newChanges = {};
    Object.keys(permissions).forEach((perm) => {
      newPermissions[perm] = false;
      newChanges[perm] = false;
    });
    setPermissions(newPermissions);
    setChanges(newChanges);
    setMessage({ type: 'info', text: 'All permissions disabled' });
  };

  // HANDLE: RESET TO DEFAULTS
  const handleResetDefaults = async () => {
    if (!selectedRole || Object.keys(changes).length === 0) {
      setMessage({ type: 'info', text: 'No changes to reset' });
      return;
    }

    try {
      setSaving(true);
      await axios.delete(`http://127.0.0.1:5000/api/admin/permissions/roles/${selectedRole}/permissions`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('authToken')}` },
      });

      setChanges({});
      setMessage({ type: 'success', text: 'Reset to default permissions' });

      // Reload permissions
      await handleRoleSelect(selectedRole);
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.detail || 'Failed to reset' });
      console.error('Error resetting permissions:', err);
    } finally {
      setSaving(false);
    }
  };

  // API: SAVE CHANGES
  const handleSaveChanges = async () => {
    if (!selectedRole || Object.keys(changes).length === 0) {
      setMessage({ type: 'info', text: 'No changes to save' });
      return;
    }

    try {
      setSaving(true);

      if (bulkMode && Object.keys(changes).length > 1) {
        // BULK UPDATE (more efficient)
        const bulkChanges = {};
        Object.keys(changes).forEach((perm) => {
          bulkChanges[perm] = permissions[perm];
        });

        await axios.put(
          `http://127.0.0.1:5000/api/admin/permissions/roles/${selectedRole}/permissions`,
          {
            permissions: bulkChanges,
            reason: 'Updated via admin panel',
          },
          { headers: { Authorization: `Bearer ${localStorage.getItem('authToken')}` } }
        );

        setMessage({ type: 'success', text: `Updated ${Object.keys(changes).length} permissions` });
      } else {
        // SINGLE UPDATES (one by one)
        for (const [permName, isGranted] of Object.entries(changes)) {
          await axios.put(
            `http://127.0.0.1:5000/api/admin/permissions/roles/${selectedRole}/permissions/${encodeURIComponent(permName)}`,
            {
              is_granted: isGranted,
              reason: 'Updated via admin panel',
            },
            { headers: { Authorization: `Bearer ${localStorage.getItem('authToken')}` } }
          );
        }

        setMessage({ type: 'success', text: `Updated ${Object.keys(changes).length} permission(s)` });
      }

      setChanges({});
    } catch (err) {
      const errorMsg = err.response?.data?.detail || 'Failed to save changes';
      setMessage({ type: 'error', text: errorMsg });
      console.error('Error saving changes:', err);
    } finally {
      setSaving(false);
    }
  };

  // ============= CATEGORY PERMISSION HANDLERS =============

  // HANDLE: CATEGORY VISIBILITY TOGGLE
  const handleCategoryVisibilityToggle = (categoryKey) => {
    const updated = { ...categoryPermissions };
    updated[categoryKey].isVisible = !updated[categoryKey].isVisible;
    setCategoryPermissions(updated);
    
    const newChanges = { ...categoryChanges };
    if (!newChanges[categoryKey]) {
      newChanges[categoryKey] = {};
    }
    newChanges[categoryKey].isVisible = updated[categoryKey].isVisible;
    setCategoryChanges(newChanges);
  };

  // HANDLE: CATEGORY FUNCTION TOGGLE
  const handleCategoryFunctionToggle = (categoryKey, func) => {
    const updated = { ...categoryPermissions };
    const idx = updated[categoryKey].allowedFunctions.indexOf(func);
    
    if (idx > -1) {
      updated[categoryKey].allowedFunctions.splice(idx, 1);
    } else {
      updated[categoryKey].allowedFunctions.push(func);
    }
    
    setCategoryPermissions(updated);
    
    const newChanges = { ...categoryChanges };
    if (!newChanges[categoryKey]) {
      newChanges[categoryKey] = {};
    }
    newChanges[categoryKey].allowedFunctions = updated[categoryKey].allowedFunctions;
    setCategoryChanges(newChanges);
  };

  // SAVE CATEGORY CHANGES
  const handleSaveCategoryChanges = async () => {
    if (Object.keys(categoryChanges).length === 0) {
      setMessage({ type: 'info', text: 'No category changes to save' });
      return;
    }

    try {
      setSaving(true);
      
      const bulkUpdate = {};
      Object.entries(categoryChanges).forEach(([catKey]) => {
        bulkUpdate[catKey] = {
          is_visible: categoryPermissions[catKey].isVisible,
          allowed_functions: categoryPermissions[catKey].allowedFunctions,
          reason: 'Updated via admin panel',
        };
      });

      await axios.post(
        `http://127.0.0.1:5000/api/admin/permissions/categories/${selectedRole}/bulk-update`,
        bulkUpdate,
        { headers: { Authorization: `Bearer ${localStorage.getItem('authToken')}` } }
      );

      setMessage({ 
        type: 'success', 
        text: `Updated ${Object.keys(categoryChanges).length} category permissions` 
      });
      setCategoryChanges({});
    } catch (err) {
      const errorMsg = err.response?.data?.detail || 'Failed to save category changes';
      setMessage({ type: 'error', text: errorMsg });
      console.error('Error saving category changes:', err);
    } finally {
      setSaving(false);
    }
  };

  // RESET CATEGORY PERMISSIONS
  const handleResetCategoryPermissions = async () => {
    if (!selectedRole || !window.confirm('Reset all category permissions for this role to defaults?')) {
      return;
    }

    try {
      setSaving(true);
      await axios.delete(
        `http://127.0.0.1:5000/api/admin/permissions/categories/${selectedRole}`,
        { headers: { Authorization: `Bearer ${localStorage.getItem('authToken')}` } }
      );

      setMessage({ type: 'success', text: 'Reset category permissions to defaults' });
      await fetchCategoryPermissions(selectedRole);
    } catch (err) {
      const errorMsg = err.response?.data?.detail || 'Failed to reset';
      setMessage({ type: 'error', text: errorMsg });
      console.error('Error resetting:', err);
    } finally {
      setSaving(false);
    }
  };

  // WEBSOCKET: Handle real-time updates
  const handlePermissionsUpdated = (data) => {
    console.log('Permissions updated:', data);
    if (data.role_id === selectedRole) {
      handleRoleSelect(selectedRole); // Reload permissions
    }
  };

  const handlePermissionsChanged = (data) => {
    console.log('Permissions changed:', data);
    if (data.role_id === selectedRole) {
      setMessage({
        type: 'info',
        text: `${data.permission_name} changed by another admin`,
      });
      handleRoleSelect(selectedRole);
    }
  };

  // RENDER
  const currentRole = roles.find((r) => r.role_id === selectedRole);
  const hasChanges = Object.keys(changes).length > 0;

  return (
    <div className="permission-manager">
      <div className="pm-header">
        <h2>Role Permission Manager</h2>
        <p>Configure which permissions each role has access to</p>
      </div>

      {/* MESSAGE DISPLAY */}
      {message.text && (
        <div className={`pm-message pm-message-${message.type}`}>
          {message.text}
        </div>
      )}

      <div className="pm-container">
        {/* LEFT PANEL - ROLE LIST */}
        <div className="pm-left">
          <h3>Roles</h3>
          <div className="pm-role-list">
            {roles.length === 0 ? (
              <p className="text-muted">Loading roles...</p>
            ) : (
              roles.map((role) => (
                <button
                  key={role.role_id}
                  className={`pm-role-item ${selectedRole === role.role_id ? 'active' : ''}`}
                  onClick={() => handleRoleSelect(role.role_id)}
                  disabled={loading}
                >
                  {role.role_name}
                  <span className="role-perm-count">{role.permissions ? Object.keys(role.permissions).length : 0}</span>
                </button>
              ))
            )}
          </div>
        </div>

        {/* RIGHT PANEL - PERMISSIONS */}
        <div className="pm-right">
          {selectedRole && currentRole ? (
            <>
              <div className="pm-role-header">
                <h3>{currentRole.role_name}</h3>
                
                {/* TABS */}
                <div className="pm-tabs">
                  <button
                    className={`pm-tab ${activeTab === 'permissions' ? 'active' : ''}`}
                    onClick={() => setActiveTab('permissions')}
                  >
                    Role Permissions
                  </button>
                  <button
                    className={`pm-tab ${activeTab === 'categories' ? 'active' : ''}`}
                    onClick={() => setActiveTab('categories')}
                  >
                    Settings Categories
                  </button>
                </div>
              </div>

              {/* ====== PERMISSIONS TAB ====== */}
              {activeTab === 'permissions' && (
                <>
                  <p className="pm-description">Manage which actions/functions this role can perform</p>

                  {/* CONTROL BUTTONS */}
                  <div className="pm-controls">
                    <button
                      className="btn btn-sm btn-outline"
                      onClick={handleEnableAll}
                      disabled={saving || Object.values(permissions).every((p) => p)}
                    >
                      Enable All
                    </button>
                    <button
                      className="btn btn-sm btn-outline"
                      onClick={handleDisableAll}
                      disabled={saving || Object.values(permissions).every((p) => !p)}
                    >
                      Disable All
                    </button>

                    <label className="pm-bulk-toggle">
                      <input
                        type="checkbox"
                        checked={bulkMode}
                        onChange={(e) => setBulkMode(e.target.checked)}
                      />
                      Bulk Update Mode
                    </label>
                  </div>

                  {/* PERMISSIOS GRID */}
              <div className="pm-grid">
                {Object.entries(permissions).map(([permName, isGranted]) => (
                  <div key={permName} className="pm-permission-item">
                    <label className="pm-permission-label">
                      <input
                        type="checkbox"
                        checked={isGranted}
                        onChange={() => handlePermissionToggle(permName)}
                        disabled={saving}
                      />
                      <span className={isGranted ? 'granted' : 'denied'}>{permName}</span>
                      {changes[permName] !== undefined && (
                        <span className="change-indicator">
                          {changes[permName] ? '✓' : '✗'}
                        </span>
                      )}
                    </label>
                  </div>
                ))}
              </div>

              {/* ACTION BUTTONS */}
              <div className="pm-actions">
                {hasChanges && (
                  <button
                    className="btn btn-primary"
                    onClick={handleSaveChanges}
                    disabled={saving}
                  >
                    {saving ? 'Saving...' : `Save Changes (${Object.keys(changes).length})`}
                  </button>
                )}
                <button
                  className="btn btn-outline"
                  onClick={() => {
                    setChanges({});
                    handleRoleSelect(selectedRole);
                  }}
                  disabled={!hasChanges || saving}
                >
                  Discard Changes
                </button>
                <button
                  className="btn btn-danger-outline"
                  onClick={handleResetDefaults}
                  disabled={saving}
                >
                  Reset to Defaults
                </button>
              </div>
                </>
              )}

              {/* ====== CATEGORIES TAB ====== */}
              {activeTab === 'categories' && (
                <>
                  <p className="pm-description">Control which settings tabs are visible and what functions this role can access</p>

                  {categories.length === 0 ? (
                    <div className="pm-placeholder">
                      <p>⚠️ Settings categories not yet initialized. Please run: <code>python initialize_categories.py</code></p>
                    </div>
                  ) : (
                    <>
                      {/* CATEGORIES GRID */}
                      <div className="pm-categories-grid">
                        {categories.map((category) => {
                          const catKey = category.category_key;
                          const perm = categoryPermissions[catKey];
                          const hasChange = categoryChanges[catKey];

                          if (!perm) return null;

                          return (
                            <div
                              key={catKey}
                              className={`pm-category-card ${perm.isVisible ? 'visible' : 'hidden'} ${hasChange ? 'changed' : ''}`}
                            >
                              {/* HEADER */}
                              <div className="pmc-header">
                                <div className="pmc-title">
                                  <h4>{category.category_name}</h4>
                                  {category.description && <p className="pmc-description">{category.description}</p>}
                                </div>
                                <label className="pmc-visibility-toggle">
                                  <input
                                    type="checkbox"
                                    checked={perm.isVisible}
                                    onChange={() => handleCategoryVisibilityToggle(catKey)}
                                    disabled={saving}
                                  />
                                  <span>{perm.isVisible ? 'Visible' : 'Hidden'}</span>
                                </label>
                              </div>

                              {/* FUNCTIONS */}
                              {perm.isVisible && (
                                <div className="pmc-functions">
                                  <p className="pmc-functions-label">Allowed Functions:</p>
                                  <div className="function-toggles">
                                    {['read', 'write', 'delete'].map(func => (
                                      <label key={func} className="function-toggle">
                                        <input
                                          type="checkbox"
                                          checked={perm.allowedFunctions.includes(func)}
                                          onChange={() => handleCategoryFunctionToggle(catKey, func)}
                                          disabled={saving || !perm.isVisible}
                                        />
                                        <span className={perm.allowedFunctions.includes(func) ? 'enabled' : 'disabled'}>
                                          {func.charAt(0).toUpperCase() + func.slice(1)}
                                        </span>
                                      </label>
                                    ))}
                                  </div>
                                </div>
                              )}

                              {/* STATUS */}
                              {hasChange && (
                                <div className="pmc-status">
                                  <span>✓ Modified</span>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>

                      {/* ACTION BUTTONS */}
                      <div className="pm-actions">
                        {Object.keys(categoryChanges).length > 0 && (
                          <button
                            className="btn btn-primary"
                            onClick={handleSaveCategoryChanges}
                            disabled={saving}
                          >
                            {saving ? 'Saving...' : `Save Category Changes (${Object.keys(categoryChanges).length})`}
                          </button>
                        )}
                        <button
                          className="btn btn-outline"
                          onClick={() => {
                            setCategoryChanges({});
                            fetchCategoryPermissions(selectedRole);
                          }}
                          disabled={Object.keys(categoryChanges).length === 0 || saving}
                        >
                          Discard Changes
                        </button>
                        <button
                          className="btn btn-danger-outline"
                          onClick={handleResetCategoryPermissions}
                          disabled={saving}
                        >
                          Reset to Defaults
                        </button>
                      </div>
                    </>
                  )}
                </>
              )}
            </>
          ) : (
            <div className="pm-placeholder">
              <p>Select a role to manage its permissions</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
