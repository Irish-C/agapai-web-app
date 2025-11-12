import React, { useState } from 'react';
import { FaLock, FaKey, FaSave, FaSpinner, FaCheckCircle, FaExclamationCircle } from 'react-icons/fa';
import { fetchApi } from '../services/apiService';

// Mock API Call to simulate password update logic
// In a real application, this would be a dedicated function in apiService.
const mockUpdatePasswordApi = async (oldPassword, newPassword) => {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 1500)); 

    // NOTE: In a production Flask app, the backend verifies the old password against the hash
    // stored in the database BEFORE hashing and saving the new one.
    
    if (oldPassword === 'admin_test') {
        // Successful response simulation
        return { status: 'success', message: 'Password updated successfully. Please log in again.' };
    } else if (oldPassword === 'error_test') {
        // Failed response simulation (e.g., database error)
         return { status: 'error', message: 'Database failed to save the new password.' };
    } else {
        // Validation failed (Old password incorrect)
        return { status: 'error', message: 'Invalid old password provided.' };
    }
};


export default function MainSettingsForm() {
    const [oldPassword, setOldPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    
    const [isLoading, setIsLoading] = useState(false);
    const [message, setMessage] = useState(null); // { type: 'success' | 'error', text: string }

    const handleSubmit = async (e) => {
        e.preventDefault();
        setMessage(null);
        
        // 1. Frontend validation
        if (newPassword.length < 8) {
            setMessage({ type: 'error', text: 'New password must be at least 8 characters long.' });
            return;
        }
        if (newPassword !== confirmPassword) {
            setMessage({ type: 'error', text: 'New password and confirmation password do not match.' });
            return;
        }

        setIsLoading(true);

        try {
            // 2. Call the backend API (using mock for demonstration)
            const result = await mockUpdatePasswordApi(oldPassword, newPassword);

            if (result.status === 'success') {
                setMessage({ type: 'success', text: result.message });
                // Clear inputs on success
                setOldPassword('');
                setNewPassword('');
                setConfirmPassword('');
            } else {
                setMessage({ type: 'error', text: result.message });
            }

        } catch (error) {
            console.error("Password update error:", error);
            setMessage({ type: 'error', text: error.message || 'An unknown network error occurred.' });
        } finally {
            setIsLoading(false);
        }
    };

    const isFormValid = oldPassword && newPassword && confirmPassword && newPassword === confirmPassword;

    return (
        <div className="bg-white p-6 rounded-xl shadow-md border border-gray-100 mb-6">
            <h2 className="text-xl font-semibold text-gray-800 flex items-center mb-4 border-b pb-2">
                <FaLock className="mr-2 text-red-500" />
                Change Password
            </h2>
            <p className="text-sm text-gray-500 mb-6">
                For security, you must provide your current password to set a new one.
            </p>

            {/* Status Message Display */}
            {message && (
                <div 
                    className={`mb-4 p-3 rounded-lg flex items-center text-sm ${
                        message.type === 'success' 
                            ? 'bg-green-100 text-green-700 border border-green-300' 
                            : 'bg-red-100 text-red-700 border border-red-300'
                    }`}
                >
                    {message.type === 'success' ? <FaCheckCircle className="mr-2" /> : <FaExclamationCircle className="mr-2" />}
                    {message.text}
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
                
                {/* 1. OLD PASSWORD FIELD (Required for security) */}
                <div>
                    <label className="block text-gray-700 text-sm font-medium mb-2" htmlFor="oldPassword">
                        <FaKey className="inline mr-1 text-teal-600" />
                        Current Password
                    </label>
                    <input
                        type="password"
                        id="oldPassword"
                        value={oldPassword}
                        onChange={(e) => setOldPassword(e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-teal-500 focus:border-teal-500 transition duration-150"
                        placeholder="Enter old password"
                        required
                        disabled={isLoading}
                    />
                </div>
                
                {/* 2. NEW PASSWORD FIELD */}
                <div>
                    <label className="block text-gray-700 text-sm font-medium mb-2" htmlFor="newPassword">
                        <FaLock className="inline mr-1 text-teal-600" />
                        New Password (min 8 characters)
                    </label>
                    <input
                        type="password"
                        id="newPassword"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-teal-500 focus:border-teal-500 transition duration-150"
                        placeholder="Enter new password"
                        minLength={8}
                        required
                        disabled={isLoading}
                    />
                </div>

                {/* 3. CONFIRM NEW PASSWORD FIELD */}
                <div>
                    <label className="block text-gray-700 text-sm font-medium mb-2" htmlFor="confirmPassword">
                        <FaLock className="inline mr-1 text-teal-600" />
                        Confirm New Password
                    </label>
                    <input
                        type="password"
                        id="confirmPassword"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-teal-500 focus:border-teal-500 transition duration-150"
                        placeholder="Confirm new password"
                        minLength={8}
                        required
                        disabled={isLoading}
                    />
                </div>

                {/* Submission Button */}
                <button
                    type="submit"
                    disabled={isLoading || !isFormValid}
                    className={`w-full flex items-center justify-center py-2.5 px-4 rounded-lg font-semibold text-white transition duration-300 shadow-md ${
                        isLoading || !isFormValid 
                            ? 'bg-gray-400 cursor-not-allowed' 
                            : 'bg-teal-600 hover:bg-teal-700'
                    }`}
                >
                    {isLoading ? (
                        <>
                            <FaSpinner className="animate-spin mr-2" />
                            Updating...
                        </>
                    ) : (
                        <>
                            <FaSave className="mr-2" />
                            Save New Password
                        </>
                    )}
                </button>
            </form>
        </div>
    );
}