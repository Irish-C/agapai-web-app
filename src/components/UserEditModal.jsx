import React, { useState, useEffect } from 'react';
import { FaUser, FaSave, FaTimes, FaSpinner, FaLock } from 'react-icons/fa';

/**
 * Modal component for adding a new user or editing an existing user.
 * @param {object} userToEdit - The user object (if editing), or null (if adding).
 * @param {function} onSave - Function to call when saving the form (handles API call).
 * @param {function} onClose - Function to close the modal.
 */
export default function UserEditModal({ userToEdit, onSave, onClose }) {
    
    // Determine if we are editing or adding
    const isEditing = !!userToEdit;
    
    // Define the roles available in the database
    const LIMITED_ROLES = ['Admin', 'User'];

    // Initial form state based on whether we are editing an existing user or adding a new one
    const [formData, setFormData] = useState({
        id: userToEdit?.id || null,
        firstname: userToEdit?.firstname || '',
        lastname: userToEdit?.lastname || '',
        username: userToEdit?.username || '',
        // 🛑 FIX: Use 'User' as the default role for new users
        role: userToEdit?.role || 'User', 
        password: '',
        confirmPassword: '',
        // Use the limited role list
        availableRoles: LIMITED_ROLES 
    });

    const [message, setMessage] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleFormSubmit = async (e) => {
        e.preventDefault();
        setMessage('');
        
        // Frontend Validation
        if (!formData.firstname || !formData.lastname || !formData.username || !formData.role) {
            setMessage('Please fill in all user details.');
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
        
        // Pass the data up to the parent component (UserManager) to handle the API call
        onSave(formData)
            .then(() => {
                // If save was successful, parent handles closing the modal
            })
            .catch((err) => {
                // Display error message from parent API call
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
                                    className="w-full border-gray-300 rounded-lg pl-2 py-2" required disabled={isLoading} />
                            </div>

                            {/* Last Name */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="lastname">Last Name</label>
                                <input type="text" id="lastname" name="lastname" value={formData.lastname} onChange={handleChange} 
                                    className="w-full border-gray-300 rounded-lg pl-2 py-2" required disabled={isLoading} />
                            </div>

                            {/* Username (Locked if editing) */}
                            <div className="md:col-span-1">
                                <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="username">Username</label>
                                <input type="text" id="username" name="username" value={formData.username} onChange={handleChange} 
                                    className={`w-full border-gray-300 rounded-lg pl-2 py-2 ${isEditing ? 'bg-gray-100' : ''}`} 
                                    required disabled={isEditing || isLoading} />
                            </div>

                            {/* Role Selection */}
                            <div className="md:col-span-1">
                                <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="role">Access Role</label>
                                <select id="role" name="role" value={formData.role} onChange={handleChange} 
                                    className="w-full border-gray-300 rounded-lg pl-2 py-2" required disabled={isLoading}>
                                    {formData.availableRoles.map(role => (
                                        <option key={role} value={role}>{role}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        {/* --- Password Fields (Only required when adding, or optional when editing) --- */}
                        <div className={`pt-4 border-t border-gray-100 grid grid-cols-1 md:grid-cols-2 gap-4 ${isEditing ? 'opacity-80' : ''}`}>
                            <div className="md:col-span-1">
                                <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="password">
                                    <FaLock className="inline mr-1 text-red-500" /> {isEditing ? 'New Password (Optional)' : 'Password'}
                                </label>
                                <input type="password" id="password" name="password" value={formData.password} onChange={handleChange} 
                                    className="w-full border-gray-300 rounded-lg pl-2 py-2" 
                                    required={!isEditing} disabled={isLoading} />
                            </div>
                            <div className="md:col-span-1">
                                <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="confirmPassword">Confirm Password</label>
                                <input type="password" id="confirmPassword" name="confirmPassword" value={formData.confirmPassword} onChange={handleChange} 
                                    className="w-full border-gray-300 rounded-lg pl-2 py-2" 
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