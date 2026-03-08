// src/pages/LoginPage.jsx
import React, { useState, useContext } from 'react';
import { AuthContext } from '../components/AuthContext.jsx';
import { FaLock, FaSignInAlt, FaUser, FaKey, FaSpinner, FaArrowLeft, FaEye, FaEyeSlash } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';

import filter_bg from '../assets/bg/filter-bg.png';
import agapaiLogo from '../assets/logo/agapai-logo.png';
import dswdLogo from '../assets/logo/dswd-logo.png';
import pupLogo from '../assets/logo/pup-logo.png';

export default function LoginPage() {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const navigate = useNavigate();
    const { login } = useContext(AuthContext);

    const goToLandingPage = () => {
        navigate('/');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);
        if (!username.trim() || !password.trim()) {
            setError('Username and password are required.');
            setIsLoading(false);
            return;
        }
        try {
            const result = await login(username, password);
            if (result.success) {
                navigate('/dashboard');
            } else {
                if (result.status === 401) {
                    setError('Wrong password. Please try again.');
                } else if (result.status === 403) {
                    setError('Account suspended. Contact support.');
                } else if (result.status === 500) {
                    setError('Server is down. Please try later.');
                } else {
                    setError(result.message || 'Login failed. Invalid credentials.');
                }
            }
        } catch (err) {
            console.error('Login submission error:', err);
            setError('An unexpected error occurred during login.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex flex-col md:flex-row bg-slate-950 text-slate-200 relative overflow-hidden">
            
            {/* --- GLOBAL BACKGROUND LAYER --- */}
            <div className="absolute inset-0 z-0">
                <div 
                    className="absolute inset-0 opacity-40" 
                    style={{ backgroundImage: `url(${filter_bg})`, backgroundSize: 'cover', backgroundPosition: 'center' }} 
                />
                <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-slate-900/80 to-slate-950" />
                <div className="absolute w-[600px] h-[600px] bg-teal-500/10 blur-[120px] rounded-full -top-20 -right-20 animate-pulse" />
                <div className="absolute w-[600px] h-[600px] bg-violet-600/10 blur-[120px] rounded-full -bottom-20 -left-20" />
            </div>

            {/* --- NEW LEFT PANEL: WELCOME CONTENT --- */}
            <div className="relative flex-1 flex flex-col justify-center items-start px-12 md:px-20 py-16 z-10 bg-transparent">
                {/* Back to Home Button remains anchored to the top-left */}
                <button 
                    onClick={goToLandingPage}
                    className="absolute top-8 left-8 z-30 flex items-center gap-2 text-slate-400 hover:text-teal-300 transition-colors group"
                >
                    <FaArrowLeft className="group-hover:-translate-x-1 transition-transform" />
                    <span className="font-medium">Back to Home</span>
                </button>

                <div className="relative z-10 flex flex-col items-start text-left w-full max-w-2xl">
                    <img 
                        src={agapaiLogo} 
                        alt="AGAPAI Logo" 
                        className="w-24 h-24 mb-8 rounded-full shadow-[0_0_50px_rgba(45,212,191,0.3)] border border-teal-500/20" 
                    />
                    <span className="px-5 py-1.5 mb-6 rounded-full bg-violet-500/10 border border-violet-500/20 text-violet-300 text-xs font-bold tracking-[0.2em] uppercase">
                        Next-Gen Elderly Care
                    </span>
                    <h1 className="text-5xl md:text-7xl font-black text-white mb-6 leading-[1.1]">
                        Welcome to <br />
                        AGAP<span className="text-teal-400">AI</span>
                    </h1>
                    <p className="text-xl md:text-2xl text-slate-300 mb-6 font-medium">
                        Ka-AGAPAI sa Seguridad ng ating mga Lolo't Lola
                    </p>
                    <p className="text-lg text-slate-400 leading-relaxed">
                        An intelligent vision-based system providing everyday monitoring for falls and inactivity, 
                        ensuring our <span className="text-violet-400 font-semibold">loved ones</span> are never alone.
                    </p>
                </div>
            </div>

            {/* --- NEW RIGHT PANEL: LOGIN FORM --- */}
            <div className="relative flex-1 flex flex-col justify-center items-center px-6 py-12 z-20 bg-transparent md:border-l border-white/5 min-h-screen">
                <div className={`relative z-10 w-full max-w-md p-10 rounded-3xl bg-white/5 backdrop-blur-2xl border border-white/10 shadow-2xl ${error ? 'animate-shake' : ''}`}>
                    <div className="text-center mb-8">
                        <h2 className="text-3xl font-bold text-white tracking-tight">LOGIN</h2>
                        <p className="text-sm text-slate-400 mt-2">
                            Access the <span className="text-teal-400 font-semibold">AGAPAI</span> Dashboard
                        </p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        {error && (
                            <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-300 rounded-xl text-sm flex items-center">
                                <FaLock className="mr-2" /> {error}
                            </div>
                        )}

                        <div>
                            <label htmlFor="login-username" className="block text-sm text-slate-400 mb-2">
                                <FaUser className="inline mr-2 text-teal-400" />
                                Username
                            </label>
                            <input
                                id="login-username"
                                type="text"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                required
                                placeholder="Enter username"
                                className="w-full bg-slate-950/50 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-teal-400 focus:ring-1 focus:ring-teal-400/20 transition"
                            />
                        </div>

                        <div>
                            <label htmlFor="login-password" className="block text-sm text-slate-400 mb-2">
                                <FaKey className="inline mr-2 text-teal-400" />
                                Password
                            </label>
                            <div className="relative">
                                <input
                                    id="login-password"
                                    type={showPassword ? "text" : "password"}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                    placeholder="********"
                                    className="w-full bg-slate-950/50 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-teal-400 focus:ring-1 focus:ring-teal-400/20 transition pr-12"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword((prev) => !prev)}
                                    className="absolute top-1/2 right-3 transform -translate-y-1/2 text-slate-500 hover:text-teal-400 focus:outline-none"
                                >
                                    {showPassword ? <FaEyeSlash /> : <FaEye />}
                                </button>
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={isLoading}
                            className={`w-full py-4 font-bold rounded-xl flex items-center justify-center gap-2 transition-all ${
                                isLoading
                                    ? 'bg-teal-700 text-slate-300 cursor-not-allowed'
                                    : 'bg-teal-500 hover:bg-teal-400 text-slate-950 shadow-lg shadow-teal-500/20 active:scale-[0.98]'
                            }`}
                        >
                            {isLoading ? (
                                <><FaSpinner className="animate-spin" /> Authenticating...</>
                            ) : (
                                <><FaSignInAlt /> LOGIN</>
                            )}
                        </button>
                    </form>

                    <div className="mt-10 pt-6 border-t border-white/5 flex justify-center items-center gap-6">
                        <img src={dswdLogo} alt="DSWD Logo" className="h-8 grayscale opacity-50 hover:grayscale-0 hover:opacity-100 transition-all" />
                        <img src={pupLogo} alt="PUP Logo" className="h-8 grayscale opacity-50 hover:grayscale-0 hover:opacity-100 transition-all" />
                    </div>
                </div>
            </div>
        </div>
    );
}