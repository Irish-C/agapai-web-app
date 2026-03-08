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
            
            {/* --- GLOBAL BACKGROUND LAYER (NO VERTICAL SPLIT) --- */}
            <div className="absolute inset-0 z-0">
                <div 
                    className="absolute inset-0 opacity-70" 
                    style={{ backgroundImage: `url(${filter_bg})`, backgroundSize: 'cover', backgroundPosition: 'center' }} 
                />
                {/* Unified Gradient Overlay - removed the "via" point to keep the middle smooth */}
                <div className="absolute inset-0 bg-gradient-to-br from-slate-950/90 via-transparent to-slate-950/90" />
                <div className="absolute inset-0 bg-slate-950/40" />
                
                {/* Glows */}
                <div className="absolute w-[800px] h-[800px] bg-teal-500/10 blur-[150px] rounded-full -top-40 -left-20 animate-pulse" />
                <div className="absolute w-[800px] h-[800px] bg-violet-600/10 blur-[150px] rounded-full -bottom-40 -right-20" />
            </div>

            {/* --- LEFT PANEL: WELCOME CONTENT --- */}
            <div className="relative flex-1 flex flex-col justify-center items-start px-12 md:px-20 py-16 z-10 bg-transparent">
                <button 
                    onClick={goToLandingPage}
                    className="absolute top-8 left-8 z-30 flex items-center gap-2 text-white hover:text-teal-300 transition-colors group bg-slate-900/40 px-4 py-2 rounded-full backdrop-blur-md border border-white/10"
                >
                    <FaArrowLeft className="group-hover:-translate-x-1 transition-transform" />
                    <span className="font-medium">Back to Home</span>
                </button>

                <div className="relative z-10 flex flex-col items-start text-left w-full max-w-2xl">
                    <img 
                        src={agapaiLogo} 
                        alt="AGAPAI Logo" 
                        className="w-24 h-24 mb-8 rounded-full shadow-[0_0_50px_rgba(45,212,191,0.5)] border-2 border-teal-400/30" 
                    />
                    <span className="px-5 py-1.5 mb-6 rounded-full bg-violet-600/30 border border-violet-400/40 text-violet-100 text-xs font-bold tracking-[0.2em] uppercase backdrop-blur-sm">
                        Next-Gen Elderly Care
                    </span>
                    <h1 className="text-5xl md:text-7xl font-black text-white mb-6 leading-[1.1] drop-shadow-2xl">
                        Welcome to <br />
                        AGAP<span className="text-teal-400">AI</span>
                    </h1>
                    <p className="text-xl md:text-2xl text-white mb-6 font-semibold drop-shadow-md">
                        Ka-AGAPAI sa Seguridad ng ating mga Lolo't Lola
                    </p>
                    <p className="text-lg text-slate-100 leading-relaxed font-medium">
                        An intelligent vision-based system providing everyday monitoring for falls and inactivity, 
                        ensuring our <span className="text-violet-300 font-bold underline decoration-violet-500/50">loved ones</span> are never alone.
                    </p>
                </div>
            </div>

            {/* --- RIGHT PANEL: LOGIN FORM (BORDER REMOVED) --- */}
            <div className="relative flex-1 flex flex-col justify-center items-center px-6 py-12 z-20 bg-transparent min-h-screen">
                <div className={`relative z-10 w-full max-w-md p-10 rounded-3xl bg-slate-950/40 backdrop-blur-3xl border border-white/10 shadow-[0_0_80px_rgba(0,0,0,0.5)] ${error ? 'animate-shake' : ''}`}>
                    <div className="text-center mb-8">
                        <h2 className="text-3xl font-bold text-white tracking-tight">LOGIN</h2>
                        <p className="text-sm text-slate-300 mt-2 font-medium">
                            Access the <span className="text-teal-300 font-bold">AGAPAI</span> Dashboard
                        </p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        {error && (
                            <div className="p-3 bg-red-600/40 border border-red-400/50 text-white rounded-xl text-sm flex items-center backdrop-blur-md">
                                <FaLock className="mr-2" /> {error}
                            </div>
                        )}

                        <div>
                            <label htmlFor="login-username" className="block text-sm text-white mb-2 font-medium">
                                <FaUser className="inline mr-2 text-teal-300" />
                                Username
                            </label>
                            <input
                                id="login-username"
                                type="text"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                required
                                placeholder="Enter username"
                                className="w-full bg-slate-950/60 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-teal-400 focus:ring-1 focus:ring-teal-400/40 transition backdrop-blur-md"
                            />
                        </div>

                        <div>
                            <label htmlFor="login-password" className="block text-sm text-white mb-2 font-medium">
                                <FaKey className="inline mr-2 text-teal-300" />
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
                                    className="w-full bg-slate-950/60 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-teal-400 focus:ring-1 focus:ring-teal-400/40 transition pr-12 backdrop-blur-md"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword((prev) => !prev)}
                                    className="absolute top-1/2 right-3 transform -translate-y-1/2 text-teal-300/70 hover:text-teal-300 focus:outline-none"
                                >
                                    {showPassword ? <FaEyeSlash /> : <FaEye />}
                                </button>
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full py-4 font-bold rounded-xl flex items-center justify-center gap-2 transition-all bg-teal-500 hover:bg-teal-400 text-slate-950 shadow-lg shadow-teal-500/40 active:scale-[0.98] disabled:bg-teal-700 disabled:text-slate-300 disabled:cursor-not-allowed"
                        >
                            {isLoading ? (
                                <><FaSpinner className="animate-spin" /> Authenticating...</>
                            ) : (
                                <><FaSignInAlt /> LOGIN</>
                            )}
                        </button>
                    </form>

                    <div className="mt-10 pt-6 border-t border-white/5 flex justify-center items-center gap-6">
                        <img src={dswdLogo} alt="DSWD Logo" className="h-10 filter brightness-110 contrast-125" />
                        <img src={pupLogo} alt="PUP Logo" className="h-10 filter brightness-110 contrast-125" />
                    </div>
                </div>
            </div>
        </div>
    );
}