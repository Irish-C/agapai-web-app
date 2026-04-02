// src/components/UserEditModal.jsx
import React, { useState, useEffect } from 'react';
import { FaUser, FaSave, FaTimes, FaSpinner, FaLock } from 'react-icons/fa';

import { normalizeRole, displayRole } from '../../utils/roleUtils.js';
import { fetchRolesApi } from '../../services/apiService.js';


/**
 * Modal component for adding a new user or editing an existing user.
 * Now dynamically fetches roles from the database.
 */
export default function UserEditModal({ userToEdit, onSave, onClose }) {
    
    // Determine if we are editing or adding
    const isEditing = !!userToEdit;
    
    // --- NEW DYNAMIC ROLE STATE ---
    const [dbRoles, setDbRoles] = useState([]);
    const [isLoadingRoles, setIsLoadingRoles] = useState(true);

    // Initial form state
    const [formData, setFormData] = useState({
        id: userToEdit?.id || null,
        firstname: userToEdit?.firstname || '',
        middle_name: userToEdit?.middle_name || '',
        lastname: userToEdit?.lastname || '',
        birthdate: userToEdit?.birthdate ? userToEdit.birthdate.slice(0, 10) : '',
        email: userToEdit?.email || '',
        username: userToEdit?.username || '',
        // Default to empty for Add User
        role: isEditing ? normalizeRole(userToEdit?.role) || '' : '',
        password: '',
        confirmPassword: ''
    });

    const [message, setMessage] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    // --- FETCH ROLES FROM DATABASE ON MOUNT ---
    useEffect(() => {
        const fetchRoles = async () => {
            try {
                setIsLoadingRoles(true);
                const result = await fetchRolesApi();
                if (result && Array.isArray(result.data)) {
                    setDbRoles(result.data.map((roleName) => normalizeRole(roleName)));
                } else if (Array.isArray(result)) {
                    setDbRoles(result.map((r) => normalizeRole(r.role_name || r.role || r.name)));
                } else {
                    setDbRoles([]);
                }
            } catch (err) {
                console.error("Failed to fetch roles from DB:", err);
                setMessage(err.message || "Could not load roles from database.");
            } finally {
                setIsLoadingRoles(false);
            }
        };

        fetchRoles();
    }, []);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleFormSubmit = async (e) => {
        e.preventDefault();
        setMessage('');

        // Frontend Validation
        if (!formData.firstname || !formData.lastname || !formData.username || !formData.role || !formData.birthdate || !formData.email) {
            setMessage('Please fill in all required user details.');
            return;
        }

        if (!isEditing && (!formData.password || formData.password.length < 8)) {
            setMessage('New user must have a password of at least 8 characters.');
            return;
        }

        if (formData.password !== formData.confirmPassword) {
            setMessage('Passwords do not match.');
            return;
        }

        setIsLoading(true);

        // Convert birthdate to ISO-8601 string for backend
        const formDataToSend = {
            ...formData,
            birthdate: formData.birthdate ? new Date(formData.birthdate).toISOString() : '',
            middle_name: formData.middle_name !== undefined ? formData.middle_name : '',
        };

        onSave(formDataToSend)
            .then(() => {
                // Success logic handled by parent
            })
            .catch((err) => {
                setMessage(err.message || 'Error saving user data.');
            })
            .finally(() => {
                setIsLoading(false);
            });
    };

    const title = isEditing ? `Edit User: ${userToEdit.username}` : 'Add New User';
    const primaryButtonText = isEditing ? 'Update User' : 'Create User';

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-sm bg-black/10">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xl transform transition-all border border-gray-200">
                {/* Header */}
                <div className="px-8 py-6 border-b border-gray-100 flex justify-between items-center bg-gray-50 rounded-t-2xl">
                    <h3 className="text-2xl font-semibold text-gray-800 flex items-center tracking-tight">
                        <FaUser className="mr-3 text-teal-600" /> {title}
                    </h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-teal-600 transition-colors p-1 rounded-full focus:outline-none focus:ring-2 focus:ring-teal-300">
                        <FaTimes size={22} />
                    </button>
                </div>
                <form onSubmit={handleFormSubmit}>
                    <div className="px-8 py-7 space-y-8">
                        {message && (
                            <div className="p-3 bg-violet-50 text-violet-700 border border-violet-200 rounded-lg text-sm">
                                {message}
                            </div>
                        )}
                        {/* Personal Info Section */}
                        <div>
                            <div className="text-xs font-semibold text-teal-700 mb-2 uppercase tracking-wider">Personal Information</div>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div>
                                    <label className="block text-xs font-medium text-gray-600 mb-1" htmlFor="firstname">First Name</label>
                                    <input type="text" id="firstname" name="firstname" value={formData.firstname} onChange={handleChange}
                                        className="w-full pl-4 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 outline-none transition-all placeholder:text-gray-300 disabled:opacity-50 text-base" required disabled={isLoading} />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-gray-600 mb-1" htmlFor="middle_name">Middle Name</label>
                                    <input type="text" id="middle_name" name="middle_name" value={formData.middle_name} onChange={handleChange}
                                        className="w-full pl-4 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 outline-none transition-all placeholder:text-gray-300 disabled:opacity-50 text-base" disabled={isLoading} />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-gray-600 mb-1" htmlFor="lastname">Last Name</label>
                                    <input type="text" id="lastname" name="lastname" value={formData.lastname} onChange={handleChange}
                                        className="w-full pl-4 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 outline-none transition-all placeholder:text-gray-300 disabled:opacity-50 text-base" required disabled={isLoading} />
                                </div>
                            </div>
                        </div>
                        {/* Account Info Section */}
                        <div>
                            <div className="text-xs font-semibold text-violet-700 mb-2 uppercase tracking-wider">Account Details</div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-medium text-gray-600 mb-1" htmlFor="email">Email Address</label>
                                    <input type="email" id="email" name="email" value={formData.email} onChange={handleChange}
                                        className="w-full pl-4 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 outline-none transition-all placeholder:text-gray-300 disabled:opacity-50 text-base" required disabled={isLoading} />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-gray-600 mb-1" htmlFor="birthdate">Birthdate</label>
                                    <input type="date" id="birthdate" name="birthdate" value={formData.birthdate} onChange={handleChange}
                                        className="w-full pl-4 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 outline-none transition-all placeholder:text-gray-300 disabled:opacity-50 text-base" required disabled={isLoading} />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-gray-600 mb-1" htmlFor="username">Username</label>
                                    <input type="text" id="username" name="username" value={formData.username} onChange={handleChange}
                                        className={`w-full pl-4 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 outline-none transition-all placeholder:text-gray-300 disabled:opacity-50 text-base ${isEditing ? 'bg-gray-100' : ''}`}
                                        required disabled={isEditing || isLoading} />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-gray-600 mb-1" htmlFor="role">Access Role</label>
                                    <select
                                        id="role"
                                        name="role"
                                        value={formData.role}
                                        onChange={handleChange}
                                        className="w-full pl-4 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 outline-none transition-all placeholder:text-gray-300 disabled:opacity-50 text-base"
                                        required
                                        disabled={isLoading || isLoadingRoles}
                                    >
                                        <option value="">Select role...</option>
                                        {isLoadingRoles ? (
                                            <option>Loading roles...</option>
                                        ) : (
                                            dbRoles.map((roleName) => (
                                                <option key={roleName} value={roleName}>
                                                    {displayRole(roleName)}
                                                </option>
                                            ))
                                        )}
                                    </select>
                                </div>
                            </div>
                        </div>
                        {/* Password Section */}
                        <div>
                            <div className="text-xs font-semibold text-teal-700 mb-2 uppercase tracking-wider">Password</div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-medium text-gray-600 mb-1" htmlFor="password">
                                        <FaLock className="inline mr-1 text-red-500" /> {isEditing ? 'New Password (Optional)' : 'Password'}
                                    </label>
                                    <input type="password" id="password" name="password" value={formData.password} onChange={handleChange}
                                        className="w-full pl-4 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 outline-none transition-all placeholder:text-gray-300 disabled:opacity-50 text-base"
                                        required={!isEditing} disabled={isLoading} />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-gray-600 mb-1" htmlFor="confirmPassword">Confirm Password</label>
                                    <input type="password" id="confirmPassword" name="confirmPassword" value={formData.confirmPassword} onChange={handleChange}
                                        className="w-full pl-4 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 outline-none transition-all placeholder:text-gray-300 disabled:opacity-50 text-base"
                                        required={!isEditing} disabled={isLoading} />
                                </div>
                            </div>
                        </div>
                    </div>
                    {/* Footer / Action Buttons */}
                    <div className="px-8 py-5 flex justify-end gap-4 border-t border-gray-100 bg-gray-50 rounded-b-2xl">
                        <button type="button" onClick={onClose} disabled={isLoading}
                            className="px-5 py-2 text-sm font-medium rounded shadow-sm border border-teal-300 text-teal-700 bg-white hover:bg-teal-50 focus:outline-none focus:ring-2 focus:ring-violet-300 transition">
                            Cancel
                        </button>
                        <button type="submit" disabled={isLoading}
                            className="px-5 py-2 text-sm font-medium rounded shadow-sm text-white bg-gradient-to-r from-teal-500 to-violet-600 hover:from-teal-600 hover:to-violet-700 focus:outline-none focus:ring-2 focus:ring-violet-300 flex items-center transition">
                            {isLoading ? <FaSpinner className="animate-spin mr-2" /> : <FaSave className="mr-2" />}
                            {primaryButtonText}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}