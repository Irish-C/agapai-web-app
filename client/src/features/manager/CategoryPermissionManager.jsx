// src/features/manager/CategoryPermissionManager.jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { socket } from '../../services/socket';
import { FaCheck, FaTimes, FaUndo, FaSave } from 'react-icons/fa';
import './CategoryPermissionManager.css';

/**
 * CategoryPermissionManager Component
 * Allows superadmin to configure which settings categories are visible
 * and what functions are allowed per role.
 */
export default function CategoryPermissionManager() {
  // STATE
  const [roles, setRoles] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedRole, setSelectedRole] = useState(null);
  const [categoryPermissions, setCategoryPermissions] = useState({});
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [changes, setChanges] = useState({});

  const API_URL = 'http://127.0.0.1:5000/api/admin/permissions';
  const authToken = localStorage.getItem('authToken');

  // FETCH DATA ON MOUNT
  useEffect(() => {
    fetchInitialData();
  }, []);

  // FETCH ALL DATA
  const fetchInitialData = async () => {
    try {
      setLoading(true);
      
      // Fetch roles
      const rolesRes = await axios.get(`${API_URL}/roles`, {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      const roleList = rolesRes.data.map(r => ({ id: r.role_id, name: r.role_name }));
      setRoles(roleList);
      
      // Fetch categories
      const catsRes = await axios.get(`${API_URL}/categories`, {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      setCategories(catsRes.data);
      
      // Set first role as selected
      if (roleList.length > 0) {
        setSelectedRole(roleList[0].id);
      }
    } catch (err) {
      setMessage({ 
        type: 'error', 
        text: 'Failed to load initial data' 
      });
      console.error('Error fetching initial data:', err);
    } finally {
      setLoading(false);
    }
  };

  // FETCH CATEGORY PERMISSIONS FOR SELECTED ROLE
  useEffect(() => {
    if (selectedRole) {
      fetchCategoryPermissions(selectedRole);
    }
  }, [selectedRole]);

  const fetchCategoryPermissions = async (roleId) => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_URL}/categories/${roleId}`, {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      
      const perms = {};
      if (response.data.categories) {
        Object.entries(response.data.categories).forEach(([key, cat]) => {
          perms[key] = {
            categoryId: cat.category_id,
            categoryName: cat.category_name,
            isVisible: cat.is_visible,
            allowedFunctions: cat.allowed_functions,
          };
        });
      }
      setCategoryPermissions(perms);
      setChanges({});
    } catch (err) {
      setMessage({ 
        type: 'error', 
        text: 'Failed to load category permissions' 
      });
      console.error('Error fetching category permissions:', err);
    } finally {
      setLoading(false);
    }
  };

  // HANDLE VISIBILITY TOGGLE
  const handleVisibilityToggle = (categoryKey) => {
    const updated = { ...categoryPermissions };
    updated[categoryKey].isVisible = !updated[categoryKey].isVisible;
    setCategoryPermissions(updated);
    
    const newChanges = { ...changes };
    if (!newChanges[categoryKey]) {
      newChanges[categoryKey] = {};
    }
    newChanges[categoryKey].isVisible = updated[categoryKey].isVisible;
    setChanges(newChanges);
  };

  // HANDLE FUNCTION TOGGLE
  const handleFunctionToggle = (categoryKey, func) => {
    const updated = { ...categoryPermissions };
    const idx = updated[categoryKey].allowedFunctions.indexOf(func);
    
    if (idx > -1) {
      updated[categoryKey].allowedFunctions.splice(idx, 1);
    } else {
      updated[categoryKey].allowedFunctions.push(func);
    }
    
    setCategoryPermissions(updated);
    
    const newChanges = { ...changes };
    if (!newChanges[categoryKey]) {
      newChanges[categoryKey] = {};
    }
    newChanges[categoryKey].allowedFunctions = updated[categoryKey].allowedFunctions;
    setChanges(newChanges);
  };

  // SAVE CHANGES
  const handleSaveChanges = async () => {
    if (Object.keys(changes).length === 0) {
      setMessage({ type: 'info', text: 'No changes to save' });
      return;
    }

    try {
      setSaving(true);
      
      const bulkUpdate = {};
      Object.entries(changes).forEach(([catKey, changeData]) => {
        bulkUpdate[catKey] = {
          is_visible: categoryPermissions[catKey].isVisible,
          allowed_functions: categoryPermissions[catKey].allowedFunctions,
          reason: 'Updated via admin panel',
        };
      });

      await axios.post(
        `${API_URL}/categories/${selectedRole}/bulk-update`,
        bulkUpdate,
        { headers: { Authorization: `Bearer ${authToken}` } }
      );

      setMessage({ 
        type: 'success', 
        text: `Updated ${Object.keys(changes).length} category permissions` 
      });
      setChanges({});
    } catch (err) {
      const errorMsg = err.response?.data?.detail || 'Failed to save changes';
      setMessage({ type: 'error', text: errorMsg });
      console.error('Error saving changes:', err);
    } finally {
      setSaving(false);
    }
  };

  // RESET TO DEFAULTS
  const handleReset = async () => {
    if (!selectedRole) return;
    
    if (!window.confirm('Reset all category permissions for this role to defaults?')) {
      return;
    }

    try {
      setSaving(true);
      await axios.delete(`${API_URL}/categories/${selectedRole}`, {
        headers: { Authorization: `Bearer ${authToken}` },
      });

      setMessage({ 
        type: 'success', 
        text: 'Reset category permissions to defaults' 
      });
      
      // Reload permissions
      await fetchCategoryPermissions(selectedRole);
    } catch (err) {
      const errorMsg = err.response?.data?.detail || 'Failed to reset';
      setMessage({ type: 'error', text: errorMsg });
      console.error('Error resetting:', err);
    } finally {
      setSaving(false);
    }
  };

  // RENDER - Messages
  const MessageBox = () => {
    if (!message.text) return null;
    const bgColor = {
      success: 'bg-green-100 border-green-400 text-green-700',
      error: 'bg-red-100 border-red-400 text-red-700',
      info: 'bg-blue-100 border-blue-400 text-blue-700',
      warning: 'bg-yellow-100 border-yellow-400 text-yellow-700',
    }[message.type] || 'bg-gray-100 border-gray-400 text-gray-700';

    return (
      <div className={`border px-4 py-3 rounded relative mb-4 ${bgColor}`}>
        {message.text}
      </div>
    );
  };

  // RENDER - Main Component
  const currentRole = roles.find(r => r.id === selectedRole);
  const hasChanges = Object.keys(changes).length > 0;

  return (
    <div className="category-permission-manager">
      <div className="cpm-header">
        <h2>Settings Categories & Functions</h2>
        <p>Control which settings tabs are visible and what functions each role can access</p>
      </div>

      <MessageBox />

      <div className="cpm-container">
        {/* LEFT PANEL - ROLES */}
        <div className="cpm-left">
          <h3>Roles</h3>
          <div className="cpm-role-list">
            {roles.map(role => (
              <button
                key={role.id}
                className={`cpm-role-item ${selectedRole === role.id ? 'active' : ''}`}
                onClick={() => setSelectedRole(role.id)}
                disabled={loading}
              >
                {role.name}
              </button>
            ))}
          </div>
        </div>

        {/* RIGHT PANEL - CATEGORIES */}
        <div className="cpm-right">
          {selectedRole && currentRole ? (
            <>
              <div className="cpm-role-header">
                <h3>{currentRole.name}</h3>
                <p>Configure which settings categories this role can access</p>
              </div>

              {/* CONTROL BUTTONS */}
              <div className="cpm-controls">
                <button
                  className="btn btn-primary"
                  onClick={handleSaveChanges}
                  disabled={saving || !hasChanges}
                >
                  <FaSave className="mr-2" />
                  Save Changes
                </button>
                <button
                  className="btn btn-secondary"
                  onClick={handleReset}
                  disabled={saving}
                >
                  <FaUndo className="mr-2" />
                  Reset to Defaults
                </button>
              </div>

              {/* CATEGORIES GRID */}
              <div className="cpm-categories-grid">
                {categories.map(category => {
                  const catKey = category.category_key;
                  const perm = categoryPermissions[catKey];
                  const hasChange = changes[catKey];

                  if (!perm) return null;

                  return (
                    <div
                      key={catKey}
                      className={`cpm-category-card ${perm.isVisible ? 'visible' : 'hidden'} ${hasChange ? 'changed' : ''}`}
                    >
                      {/* HEADER */}
                      <div className="cpc-header">
                        <div className="cpc-title">
                          <h4>{category.category_name}</h4>
                          <p className="cpc-description">{category.description}</p>
                        </div>
                        <div className="cpc-visibility">
                          <label className="cpc-visibility-toggle">
                            <input
                              type="checkbox"
                              checked={perm.isVisible}
                              onChange={() => handleVisibilityToggle(catKey)}
                              disabled={saving}
                            />
                            <span className="toggle-label">
                              {perm.isVisible ? 'Visible' : 'Hidden'}
                            </span>
                          </label>
                        </div>
                      </div>

                      {/* FUNCTIONS */}
                      {perm.isVisible && (
                        <div className="cpc-functions">
                          <p className="cpc-functions-label">Allowed Functions:</p>
                          <div className="function-toggles">
                            {['read', 'write', 'delete'].map(func => (
                              <label
                                key={func}
                                className="function-toggle"
                              >
                                <input
                                  type="checkbox"
                                  checked={perm.allowedFunctions.includes(func)}
                                  onChange={() => handleFunctionToggle(catKey, func)}
                                  disabled={saving || !perm.isVisible}
                                />
                                <span className={`func-label ${perm.allowedFunctions.includes(func) ? 'enabled' : 'disabled'}`}>
                                  {func.charAt(0).toUpperCase() + func.slice(1)}
                                </span>
                              </label>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* STATUS INDICATOR */}
                      {hasChange && (
                        <div className="cpc-status">
                          <FaCheck className="changed-indicator" />
                          <span>Modified</span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </>
          ) : (
            <div className="cpm-no-selection">
              <p>Select a role to configure its category permissions</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
