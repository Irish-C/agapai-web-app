// src/components/UserEditModal.jsx
import React, { useState, useEffect } from 'react';
import { FaUser, FaSave, FaTimes, FaSpinner, FaLock } from 'react-icons/fa';

import { normalizeRole, displayRole } from '../../utils/roleUtils.js';


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
                // Ensure the URL matches your backend route
                const response = await fetch('/api/roles', {
                    headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
                });
                const result = await response.json();
                
                if (result.status === 'success') {
                    setDbRoles(result.data);
                    // Do NOT auto-select a role for Add User; keep empty
                }
            } catch (err) {
                console.error("Failed to fetch roles from DB:", err);
                setMessage("Could not load roles from database.");
            } finally {
                setIsLoadingRoles(false);
            }
        };

        fetchRoles();
    }, [isEditing]);

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

    const title = isEditing ? `Edit User: ${userToEdit.username}` : 'Add New System User';
    const primaryButtonText = isEditing ? 'Update User' : 'Create User';

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg transform transition-all">
                
                {/* Header */}
                <div className="p-5 border-b border-gray-200 flex justify-between items-center">
                    <h3 className="text-xl font-bold text-gray-800 flex items-center">
                        <FaUser className="mr-3 text-teal-600" /> {title}
                    </h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-700">
                        <FaTimes size={20} />
                    </button>
                </div>

                {/* Body */}
                <form onSubmit={handleFormSubmit}>
                    <div className="p-5 space-y-4">

                        {message && (
                            <div className="p-3 bg-red-100 text-red-700 border border-red-300 rounded-lg text-sm">
                                {message}
                            </div>
                        )}

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* First Name */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="firstname">First Name</label>
                                <input type="text" id="firstname" name="firstname" value={formData.firstname} onChange={handleChange} 
                                    className="w-full border-gray-300 rounded-lg px-3 py-2 border focus:ring-2 focus:ring-teal-500 outline-none" required disabled={isLoading} />
                            </div>
                            {/* Middle Name (optional) */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="middle_name">Middle Name (optional)</label>
                                <input type="text" id="middle_name" name="middle_name" value={formData.middle_name} onChange={handleChange} 
                                    className="w-full border-gray-300 rounded-lg px-3 py-2 border focus:ring-2 focus:ring-teal-500 outline-none" disabled={isLoading} />
                            </div>
                            {/* Last Name */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="lastname">Last Name</label>
                                <input type="text" id="lastname" name="lastname" value={formData.lastname} onChange={handleChange} 
                                    className="w-full border-gray-300 rounded-lg px-3 py-2 border focus:ring-2 focus:ring-teal-500 outline-none" required disabled={isLoading} />
                            </div>
                            {/* Email */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="email">Email Address</label>
                                <input type="email" id="email" name="email" value={formData.email} onChange={handleChange} 
                                    className="w-full border-gray-300 rounded-lg px-3 py-2 border focus:ring-2 focus:ring-teal-500 outline-none" required disabled={isLoading} />
                            </div>
                            {/* Birthdate */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="birthdate">Birthdate</label>
                                <input type="date" id="birthdate" name="birthdate" value={formData.birthdate} onChange={handleChange} 
                                    className="w-full border-gray-300 rounded-lg px-3 py-2 border focus:ring-2 focus:ring-teal-500 outline-none" required disabled={isLoading} />
                            </div>
                            {/* Username (Locked if editing) */}
                            <div className="md:col-span-1">
                                <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="username">Username</label>
                                <input type="text" id="username" name="username" value={formData.username} onChange={handleChange} 
                                    className={`w-full border-gray-300 rounded-lg px-3 py-2 border ${isEditing ? 'bg-gray-100' : 'focus:ring-2 focus:ring-teal-500 outline-none'}`} 
                                    required disabled={isEditing || isLoading} />
                            </div>
                            {/* DYNAMIC ROLE SELECTION */}
                            <div className="md:col-span-1">
                                <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="role">Access Role</label>
                                <select 
                                    id="role"
                                    name="role"
                                    value={formData.role}
                                    onChange={handleChange}
                                    className="w-full border-gray-300 rounded-lg px-3 py-2 border bg-white focus:ring-2 focus:ring-teal-500 outline-none"
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

                        {/* Password Fields */}
                        <div className={`pt-4 border-t border-gray-100 grid grid-cols-1 md:grid-cols-2 gap-4 ${isEditing ? 'opacity-80' : ''}`}>
                            <div className="md:col-span-1">
                                <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="password">
                                    <FaLock className="inline mr-1 text-red-500" /> {isEditing ? 'New Password (Optional)' : 'Password'}
                                </label>
                                <input type="password" id="password" name="password" value={formData.password} onChange={handleChange} 
                                    className="w-full border-gray-300 rounded-lg px-3 py-2 border focus:ring-2 focus:ring-teal-500 outline-none" 
                                    required={!isEditing} disabled={isLoading} />
                            </div>
                            <div className="md:col-span-1">
                                <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="confirmPassword">Confirm Password</label>
                                <input type="password" id="confirmPassword" name="confirmPassword" value={formData.confirmPassword} onChange={handleChange} 
                                    className="w-full border-gray-300 rounded-lg px-3 py-2 border focus:ring-2 focus:ring-teal-500 outline-none" 
                                    required={!isEditing} disabled={isLoading} />
                            </div>
                        </div>
                    </div>

                    {/* Footer / Action Buttons */}
                    <div className="p-5 flex justify-end gap-3 border-t border-gray-200">
                        <button type="button" onClick={onClose} disabled={isLoading}
                            className="px-4 py-2 text-sm font-medium rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 transition">
                            Cancel
                        </button>
                        <button type="submit" disabled={isLoading}
                            className="px-4 py-2 text-sm font-medium rounded-lg text-white bg-teal-600 hover:bg-teal-700 flex items-center transition">
                            {isLoading ? <FaSpinner className="animate-spin mr-2" /> : <FaSave className="mr-2" />}
                            {primaryButtonText}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}