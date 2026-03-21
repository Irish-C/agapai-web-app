// src/pages/LoginPage.jsx
import React, { useState, useContext } from 'react';
import { AuthContext } from '../components/AuthContext.jsx';
import { FaLock, FaUser, FaKey, FaSpinner, FaArrowLeft, FaEye, FaEyeSlash } from 'react-icons/fa';
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

    const goToLandingPage = () => navigate('/');

    const sanitizeUsername = (value) => {
        if (typeof value !== 'string') return '';
        return value
            .replace(/[^a-zA-Z0-9_.-]/g, '')
            .slice(0, 50);
    };

    const sanitizePassword = (value) => {
        if (typeof value !== 'string') return '';
        return value.replace(/[\u0000-\u001F\u007F]/g, '').slice(0, 128);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        try {
            // This calls the login function in your AuthContext, 
            // which in turn calls loginUser in your apiService.
            const result = await login(sanitizeUsername(username), sanitizePassword(password));
            
            if (result.success) {
                navigate('/dashboard'); 
            } else {
                setError(result.message);
            }
        } catch (err) {
            setError(err.message || 'Connection to server failed.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex flex-col md:flex-row bg-slate-950 text-slate-200 relative overflow-hidden">
            {/* Background Decorations */}
            <div className="absolute inset-0 z-0">
                <div className="absolute inset-0 opacity-70" style={{ backgroundImage: `url(${filter_bg})`, backgroundSize: 'cover' }} />
                <div className="absolute inset-0 bg-gradient-to-br from-slate-950/90 via-transparent to-slate-950/90" />
                <div className="absolute w-[800px] h-[800px] bg-teal-500/10 blur-[150px] rounded-full -top-40 -left-20 animate-pulse" />
            </div>

            {/* Top Navigation */}
            <div className="absolute top-8 left-8 z-50 flex items-center gap-6">
                <div className="flex items-center gap-3">
                    <img src={agapaiLogo} alt="Logo" className="w-12 h-12 rounded-full border border-teal-400/20 shadow-lg" />
                    <span className="text-xl font-black text-white">AGAP<span className="text-teal-400">AI</span></span>
                </div>
                <div className="h-6 w-[1px] bg-white/20" />
                <button onClick={goToLandingPage} className="flex items-center gap-2 text-slate-300 hover:text-teal-300 transition-colors group">
                    <FaArrowLeft className="group-hover:-translate-x-1 transition-transform" />
                    <span className="text-sm font-medium">Back to Home</span>
                </button>
            </div>

            {/* Content Section */}
            <div className="relative flex-1 flex flex-col justify-center px-12 md:px-20 z-10">
                <div className="max-w-2xl">
                    <div className="inline-flex items-center gap-2 px-3 py-1 mb-8 rounded-full bg-violet-500/10 border border-violet-500/20 backdrop-blur-md">
                        <span className="h-2 w-2 rounded-full bg-violet-500 animate-ping"></span>
                        <span className="text-[10px] font-bold uppercase tracking-widest text-violet-400">Next-Gen Elderly Care</span>
                    </div>
                    <h1 className="text-5xl md:text-8xl font-black text-white mb-6">Welcome to <br /> AGAP<span className="text-teal-400">AI</span></h1>
                    <p className="text-xl text-white mb-8 font-semibold">Ka-AGAPAI sa Seguridad ng ating mga Lolo't Lola</p>
                </div>
            </div>

            {/* Login Form Section */}
            <div className="relative flex-1 flex flex-col justify-center items-center px-6 z-20">
                <div className="w-full max-w-md p-10 rounded-3xl bg-slate-950/40 backdrop-blur-3xl border border-white/10 shadow-2xl">
                    <div className="text-center mb-8">
                        <h2 className="text-3xl font-bold text-white tracking-tight">LOGIN</h2>
                        <p className="text-sm text-slate-300 mt-2">Enter your credentials to continue</p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        {error && (
                            <div className="p-3 bg-red-600/40 border border-red-400/50 text-white rounded-xl text-sm flex items-center">
                                <FaLock className="mr-2" /> {error}
                            </div>
                        )}

                        <div>
                            <label className="block text-sm text-white mb-2 font-medium">Username</label>
                            <div className="relative">
                                <FaUser className="absolute left-4 top-1/2 -translate-y-1/2 text-teal-400/60" />
                                <input
                                    type="text"
                                    value={username}
                                    onChange={(e) => setUsername(sanitizeUsername(e.target.value))}
                                    required
                                    className="w-full bg-slate-950/60 border border-white/10 rounded-xl pl-12 pr-4 py-3 text-white focus:border-teal-400 outline-none transition"
                                    placeholder="Enter username"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm text-white mb-2 font-medium">Password</label>
                            <div className="relative">
                                <FaKey className="absolute left-4 top-1/2 -translate-y-1/2 text-teal-400/60" />
                                <input
                                    type={showPassword ? "text" : "password"}
                                    value={password}
                                    onChange={(e) => setPassword(sanitizePassword(e.target.value))}
                                    required
                                    className="w-full bg-slate-950/60 border border-white/10 rounded-xl pl-12 pr-12 py-3 text-white focus:border-teal-400 outline-none transition"
                                    placeholder="********"
                                />
                                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-teal-300/70">
                                    {showPassword ? <FaEyeSlash /> : <FaEye />}
                                </button>
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full py-4 bg-teal-600 hover:bg-teal-300 text-white hover:text-slate-950 font-bold rounded-xl transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                        >
                            {isLoading ? <><FaSpinner className="animate-spin" /> Authenticating...</> : "LOGIN"}
                        </button>
                    </form>

                    <div className="mt-10 pt-6 border-t border-white/5 flex justify-center gap-6">
                        <img src={dswdLogo} alt="DSWD" className="h-10 opacity-80" />
                        <img src={pupLogo} alt="PUP" className="h-10 opacity-80" />
                    </div>
                </div>
            </div>
        </div>
    );
}