import React, { useState, useEffect } from 'react';
import { FaLock, FaKey, FaSave, FaSpinner, FaCheckCircle, FaExclamationCircle, FaUser } from 'react-icons/fa';
import { fetchApi, fetchUserProfile, changePassword } from '../services/apiService'; 

// Define default structure for loading state fallback
const initialProfileState = { 
    firstname: 'N/A', 
    lastname: 'User', 
    username: 'Loading...', 
    role: 'Loading...' 
};

// Component now expects 'user' prop containing { username, role, userId, token }
export default function AccountSettingsForm({ user }) {
    
    // Initialize profile primarily using the 'user' prop (guaranteed basic info)
    const [profile, setProfile] = useState({
        ...initialProfileState,
        username: user?.username || initialProfileState.username,
        role: user?.role || initialProfileState.role,
    });
    
    const [isProfileLoading, setIsProfileLoading] = useState(true);

    const [oldPassword, setOldPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    
    const [isLoading, setIsLoading] = useState(false);
    const [message, setMessage] = useState(null); // { type: 'success' | 'error', text: string }


    // --- Effect to Fetch User Profile Details on Mount ---
    useEffect(() => {
        // Ensure user object exists and has required IDs before trying to fetch
        if (!user || !user.userId) {
            setIsProfileLoading(false); // Stop loading if authentication is missing
            return;
        }

        const loadProfile = async () => {
            setIsProfileLoading(true);
            
            try {
                const data = await fetchUserProfile(); 
                
                const fetchedDetails = typeof data === 'object' && data !== null ? data : {};

                // 🛑 MERGE: Merge fetched data (firstname/lastname) with guaranteed data from the prop
                setProfile({
                    ...user, // Basic info (username, role) from prop
                    ...fetchedDetails, // Fetched names
                    firstname: fetchedDetails.firstname || 'N/A', 
                    lastname: fetchedDetails.lastname || 'User',
                    // The username and role are guaranteed to be correct here
                });

            } catch (error) {
                console.error("Error fetching profile details:", error);
                
                // On API error, display error and revert to basic prop data
                setProfile(prev => ({
                    ...user, // Use fresh data from prop as fallback
                    firstname: prev.firstname !== 'N/A' ? prev.firstname : 'N/A', // Keep if already partially loaded
                    lastname: prev.lastname !== 'User' ? prev.lastname : 'User',
                }));
                setMessage({ type: 'error', text: 'Failed to load full profile details. Please check your backend logs.' });
            } finally {
                // Guarantee this runs to unlock the UI
                setIsProfileLoading(false);
            }
        };

        loadProfile();
    }, [user]); // Rerun when the user prop changes (e.g., after login)


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
            // 2. Call the REAL backend API service
            const result = await changePassword(oldPassword, newPassword);

            if (result.status === 'success') {
                setMessage({ type: 'success', text: result.message + " Please log in again with your new password." });
                setOldPassword('');
                setNewPassword('');
                setConfirmPassword('');
            } else {
                setMessage({ type: 'error', text: result.message || 'Password update failed.' });
            }

        } catch (error) {
            console.error("Password submission error:", error);
            setMessage({ type: 'error', text: error.message || 'An unknown network error occurred.' });
        } finally {
            setIsLoading(false);
        }
    };

    const isFormValid = oldPassword && newPassword && confirmPassword && newPassword === confirmPassword && !isProfileLoading;

    return (
        <div className="space-y-8">
            
            {/* --------------------------------- 1. PROFILE INFORMATION --------------------------------- */}
            <div className="bg-white p-6 rounded-xl shadow-md border border-gray-100">
                <h2 className="text-xl font-semibold text-gray-800 flex items-center mb-4 border-b pb-2">
                    <FaUser className="mr-2 text-teal-600" />
                    User Profile
                </h2>
                
                {isProfileLoading ? (
                    <div className="text-center py-4 text-gray-500 flex items-center justify-center">
                         <FaSpinner className="animate-spin mr-2" /> Loading profile details...
                    </div>
                ) : (
                    <div className="space-y-2 text-sm text-gray-700">
                        {/* Displaying First Name and Last Name from the fetched 'profile' state */}
                        <div className="flex justify-between border-b pb-1">
                            <span className="font-medium">Full Name:</span>
                            <span>{profile.firstname} {profile.lastname}</span> 
                        </div>
                        <div className="flex justify-between border-b pb-1">
                            <span className="font-medium">Username:</span>
                            <span>{profile.username}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="font-medium">Access Role:</span>
                            <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                                profile.role === 'Admin' ? 'bg-indigo-100 text-indigo-800' : 'bg-green-100 text-green-800'
                            }`}>
                                {profile.role}
                            </span>
                        </div>
                    </div>
                )}
            </div>

            {/* --------------------------------- 2. CHANGE PASSWORD FORM --------------------------------- */}
            <div className="bg-white p-6 rounded-xl shadow-md border border-gray-100">
                <h2 className="text-xl font-semibold text-gray-800 flex items-center mb-4 border-b pb-2">
                    <FaLock className="mr-2 text-red-500" />
                    Change Password
                </h2 >
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
                    
                    {/* 1. OLD PASSWORD FIELD */}
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
        </div>
    );
}