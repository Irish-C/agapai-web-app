// src/components/AccountSettingsForm.jsx
import React, { useState, useEffect, useMemo } from 'react';
import { 
    FaLock, FaKey, FaSave, FaSpinner, FaCheckCircle, 
    FaExclamationCircle, FaUser, FaEnvelope, FaIdBadge, 
    FaCalendarAlt, FaEye, FaEyeSlash, FaCheck 
} from 'react-icons/fa';
import { fetchUserProfile, changePassword } from '../../services/apiService'; 
import { useUserFeatures } from '../../hooks/useUserFeatures.js';
import { normalizeRole, displayRole } from '../../utils/roleUtils.js';

const initialProfileState = { 
    firstname: '', middle_name: '', lastname: '', 
    username: '', email: '', birthdate: null, role: '' 
};

export default function AccountSettingsForm({ user }) {
    const features = useUserFeatures();
    
    const sanitizePassword = (value) => {
        if (typeof value !== 'string') return '';
        return value.replace(/[\u0000-\u001F\u007F]/g, '').slice(0, 128);
    };

    // --- State Management ---
    const [profile, setProfile] = useState(() => ({
        ...initialProfileState,
        username: user?.username || 'Loading...',
        role: normalizeRole(user?.role) || 'User',
    }));
    
    const [isProfileLoading, setIsProfileLoading] = useState(true);
    const [oldPassword, setOldPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [message, setMessage] = useState(null); 
    const [countdown, setCountdown] = useState(null);

    // --- Profile Fetching ---
    useEffect(() => {
        if (!user?.userId) {
            setIsProfileLoading(false);
            return;
        }

        const loadProfile = async () => {
            setIsProfileLoading(true);
            try {
                const data = await fetchUserProfile();
                if (data) {
                    setProfile({
                        ...data,
                        role: normalizeRole(user.role) || normalizeRole(data.role),
                    });
                }
            } catch (error) {
                console.error("Profile Load Error:", error);
                setMessage({ type: 'error', text: 'Failed to sync profile data.' });
            } finally {
                setIsProfileLoading(false);
            }
        };
        
        loadProfile();
    }, [user]);

    // --- Validation Logic ---
    const isMatching = newPassword && confirmPassword && newPassword === confirmPassword;
    const hasNumber = /[0-9]/.test(newPassword);
    const hasSpecial = /[^A-Za-z0-9]/.test(newPassword);
    const isFormValid = oldPassword && newPassword.length >= 8 && hasNumber && hasSpecial && isMatching;

    // --- Submit & Redirect Logic ---
    const handleSubmit = async (e) => {
        e.preventDefault();
        setMessage(null);
        if (!isFormValid) return;

        const sanitizedOldPassword = sanitizePassword(oldPassword);
        const sanitizedNewPassword = sanitizePassword(newPassword);

        setIsLoading(true);
        try {
            const result = await changePassword(sanitizedOldPassword, sanitizedNewPassword);
            if (result.status === 'success') {
                setMessage({ type: 'success', text: "Password changed! Logging out in..." });
                
                // Clear inputs
                setOldPassword('');
                setNewPassword('');
                setConfirmPassword('');

                // Start 3-second countdown
                let timer = 3;
                setCountdown(timer);
                
                const interval = setInterval(() => {
                    timer -= 1;
                    setCountdown(timer);
                    if (timer <= 0) {
                        clearInterval(interval);
                        // TRIGGER LOGOUT
                        localStorage.removeItem('token'); // Adjust based on your auth storage
                        window.location.href = '/login'; 
                    }
                }, 1000);
            }
        } catch (error) {
            setMessage({ type: 'error', text: error.message || 'Update failed.' });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="max-w-6xl mx-auto p-4 lg:p-8 animate-in fade-in duration-500">
            <div className="flex flex-col lg:flex-row gap-8">
                
                {/* --- SIDEBAR: PROFILE INFO --- */}
                <div className="w-full lg:w-1/3 space-y-6">
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                        <div className="h-24 bg-gradient-to-r from-indigo-600 to-teal-500"></div>
                        <div className="px-6 pb-6 text-center">
                            <div className="relative -mt-12 mb-4 inline-block">
                                <div className="h-24 w-24 bg-white p-1 rounded-full shadow-md">
                                    <div className="h-full w-full bg-gray-100 rounded-full flex items-center justify-center text-gray-400">
                                        <FaUser size={40} />
                                    </div>
                                </div>
                            </div>

                            <div className="mb-6">
                                <h2 className="text-xl font-bold text-gray-800">
                                    {isProfileLoading ? '...' : `${profile.firstname} ${profile.lastname}`}
                                </h2>
                                <p className="text-sm text-gray-500 italic">@{profile.username}</p>
                                <div className="mt-3">
                                    <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                                        normalizeRole(profile.role) === 'admin' ? 'bg-indigo-100 text-indigo-700' : 'bg-teal-100 text-teal-700'
                                    }`}>
                                        {displayRole(profile.role)}
                                    </span>
                                </div>
                            </div>

                            <div className="space-y-4 border-t pt-6 text-left">
                                <ProfileItem icon={<FaEnvelope className="text-gray-400" />} label="Email Address" value={profile.email} />
                                <ProfileItem icon={<FaIdBadge className="text-gray-400" />} label="Full Name" value={`${profile.firstname} ${profile.middle_name} ${profile.lastname}`} />
                                <ProfileItem icon={<FaCalendarAlt className="text-gray-400" />} label="Birthday" value={profile.birthdate ? new Date(profile.birthdate).toLocaleDateString() : 'Not Set'} />
                            </div>
                        </div>
                    </div>
                </div>

                {/* --- MAIN CONTENT: SECURITY --- */}
                <div className="w-full lg:w-2/3">
                    {/* Render password change section only if user has change_password feature */}
                    {features.change_password ? (
                        <div className="bg-white p-6 lg:p-8 rounded-2xl shadow-sm border border-gray-200">
                            <div className="mb-8">
                                <h2 className="text-2xl font-bold text-gray-800">Security Settings</h2>
                                <p className="text-gray-500 mt-1">Keep your account safe by using a strong password.</p>
                            </div>

                        {message && (
    <div className={`mb-6 p-4 rounded-xl flex items-center justify-between border shadow-sm transition-all duration-300 ${
        message.type === 'success' 
            ? 'bg-green-50 border-green-200 text-green-800 animate-in slide-in-from-top-2' 
            : 'bg-red-50 border-red-200 text-red-800 animate-shake'
    }`}>
        <div className="flex items-start gap-3">
            <div className="mt-0.5">
                {message.type === 'success' ? (
                    <FaCheckCircle className="text-green-500 text-lg" />
                ) : (
                    <FaExclamationCircle className="text-red-500 text-lg" />
                )}
            </div>
            <div>
                <p className="text-sm font-bold leading-tight">
                    {message.type === 'success' ? 'Update Successful' : 'Update Failed'}
                </p>
                <p className="text-xs opacity-90 mt-0.5">{message.text}</p>
            </div>
        </div>

        {/* The Countdown Ring */}
        {countdown !== null && (
            <div className="relative flex items-center justify-center h-10 w-10">
                <svg className="absolute h-full w-full -rotate-90">
                    <circle
                        cx="20"
                        cy="20"
                        r="16"
                        stroke="currentColor"
                        strokeWidth="3"
                        fill="transparent"
                        className="text-green-200"
                    />
                    <circle
                        cx="20"
                        cy="20"
                        r="16"
                        stroke="currentColor"
                        strokeWidth="3"
                        fill="transparent"
                        strokeDasharray="100"
                        strokeDashoffset={100 - (countdown * 33.3)}
                        className="text-green-600 transition-all duration-1000"
                    />
                </svg>
                <span className="text-[10px] font-black text-green-700">{countdown}s</span>
            </div>
        )}
    </div>
                        )}

                        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="md:col-span-2">
                                <PasswordField 
                                    label="Current Password" 
                                    id="oldPassword"
                                    value={oldPassword}
                                    onChange={(e) => setOldPassword(sanitizePassword(e.target.value))}
                                    icon={<FaKey />}
                                    disabled={isLoading || countdown !== null}
                                    placeholder="Enter current password"
                                />
                            </div>
                            
                            <PasswordField 
                                label="New Password" 
                                id="newPassword"
                                value={newPassword}
                                onChange={(e) => setNewPassword(sanitizePassword(e.target.value))}
                                icon={<FaLock />}
                                disabled={isLoading || countdown !== null}
                                showRequirements={true}
                                placeholder="Min. 8 characters"
                            />

                            <PasswordField 
                                label="Confirm Password" 
                                id="confirmPassword"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(sanitizePassword(e.target.value))}
                                icon={<FaLock />}
                                disabled={isLoading || countdown !== null}
                                isMatching={isMatching}
                                placeholder="Repeat new password"
                            />

                            <div className="md:col-span-2 pt-4">
                                <button
                                    type="submit"
                                    disabled={isLoading || !isFormValid || countdown !== null}
                                    className={`w-full md:w-max px-10 py-3.5 rounded-xl font-bold text-white transition-all shadow-lg flex items-center justify-center gap-3 ${
                                        isLoading || !isFormValid || countdown !== null
                                            ? 'bg-gray-300 cursor-not-allowed shadow-none' 
                                            : 'bg-teal-600 hover:bg-teal-700 hover:-translate-y-0.5 active:translate-y-0 shadow-teal-600/20'
                                    }`}
                                >
                                    {isLoading ? <FaSpinner className="animate-spin" /> : <FaSave />}
                                    {isLoading ? 'Updating...' : 'Save New Password'}
                                </button>
                            </div>
                        </form>
                        </div>
                    ) : (
                        <div className="bg-white p-6 lg:p-8 rounded-2xl shadow-sm border border-gray-200">
                            <div className="text-center py-8">
                                <FaLock className="text-gray-300 text-4xl mx-auto mb-3" />
                                <h3 className="text-lg font-semibold text-gray-700 mb-2">Access Denied</h3>
                                <p className="text-gray-500">You don't have permission to change your password.</p>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

// --- Specialized Components ---

function PasswordField({ label, icon, value, showRequirements, isMatching, ...props }) {
    const [showPassword, setShowPassword] = useState(false);

    const requirements = [
        { label: 'At least 8 characters', met: value.length >= 8 },
        { label: 'Contains a number', met: /[0-9]/.test(value) },
        { label: 'Special character (!@#$%)', met: /[^A-Za-z0-9]/.test(value) },
    ];

    const strength = useMemo(() => {
        if (!showRequirements || !value) return null;
        const metCount = requirements.filter(r => r.met).length;
        const levels = [
            { label: 'Weak', color: 'bg-red-400', width: '33%' },
            { label: 'Good', color: 'bg-blue-400', width: '66%' },
            { label: 'Strong', color: 'bg-green-500', width: '100%' },
        ];
        return metCount > 0 ? levels[metCount - 1] : { label: 'Too short', color: 'bg-gray-200', width: '10%' };
    }, [value, showRequirements, requirements]);

    return (
        <div className="space-y-3">
            <div className="flex justify-between items-center px-1">
                <label className="text-sm font-bold text-gray-700 flex items-center gap-2" htmlFor={props.id}>
                    <span className="text-teal-600">{icon}</span>
                    {label}
                </label>
                {isMatching && (
                    <span className="text-green-600 text-[10px] font-bold uppercase flex items-center gap-1 animate-pulse">
                        <FaCheck /> Matches
                    </span>
                )}
            </div>
            
            <div className="relative group">
                <input
                    {...props}
                    value={value}
                    type={showPassword ? "text" : "password"}
                    className="w-full pl-4 pr-12 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 outline-none transition-all placeholder:text-gray-300 disabled:opacity-50"
                />
                <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-teal-600 transition-colors focus:outline-none"
                >
                    {showPassword ? <FaEyeSlash size={18} /> : <FaEye size={18} />}
                </button>
            </div>

            {showRequirements && value.length > 0 && (
                <div className="p-4 bg-gray-50 border border-gray-100 rounded-xl space-y-3 shadow-inner">
                    <div className="h-1.5 w-full bg-gray-200 rounded-full overflow-hidden">
                        <div 
                            className={`h-full transition-all duration-500 ${strength.color}`}
                            style={{ width: strength.width }}
                        />
                    </div>
                    <div className="grid grid-cols-1 gap-2">
                        {requirements.map((req, index) => (
                            <div key={index} className={`flex items-center gap-2 text-[11px] font-medium transition-colors ${req.met ? 'text-green-600' : 'text-gray-400'}`}>
                                {req.met ? <FaCheckCircle /> : <div className="w-3 h-3 rounded-full border-2 border-gray-200" />}
                                {req.label}
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}

function ProfileItem({ icon, label, value }) {
    return (
        <div className="flex items-start gap-3">
            <div className="mt-1 text-sm">{icon}</div>
            <div className="overflow-hidden">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-none mb-1">{label}</p>
                <p className="text-sm text-gray-700 font-semibold truncate">{value || 'Not Provided'}</p>
            </div>
        </div>
    );
}