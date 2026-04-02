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
        <div className="min-h-screen w-full flex flex-col bg-[#0f172a] text-slate-200 font-sans selection:bg-teal-400/30 overflow-hidden relative flex-col justify-between">
            {/* BACKGROUND LAYER */}
            <div 
                className="fixed inset-0 z-0 opacity-100"
                style={{
                    backgroundImage: `url(${filter_bg})`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                }}
            />
            <div className="fixed inset-0 bg-gradient-to-b from-slate-950/80 via-slate-900/50 to-slate-950 z-0"></div>

            {/* TOP NAVIGATION */}
            <nav className="relative z-50 w-full max-w-7xl mx-auto flex justify-between items-center px-6 py-6 shrink-0">
                <div className="flex items-center gap-6">
                    <div className="flex items-center gap-3">
                        <img src={agapaiLogo} alt="Logo" className="w-9 h-9 rounded-xl shadow-lg shadow-teal-400/20" />
                        <span className="text-xl font-bold tracking-tight text-white uppercase">
                            AGAP<span className="text-teal-400">AI</span>
                        </span>
                    </div>
                    <button onClick={goToLandingPage} className="flex items-center gap-2 text-slate-300 hover:text-teal-300 transition-colors group ml-4">
                        <span className="text-sm font-medium">Back to Home</span>
                    </button>
                </div>
            </nav>

            {/* SIDE-BY-SIDE LAYOUT (TIGHTER, CENTERED) */}
            <div className="relative z-10 flex flex-col md:flex-row items-center justify-center w-full max-w-7xl mx-auto px-6 flex-1" style={{ minHeight: '0', flexGrow: 1 }}>
                {/* LEFT: WELCOME MESSAGE (align top with login card) */}
                <div className="flex-1 flex flex-col items-center md:items-start max-w-xl md:max-w-md lg:max-w-lg xl:max-w-xl justify-center" style={{ marginTop: '-2rem' }}>
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-violet-500/10 border border-violet-500/20 w-fit mb-4 mt-2 md:mt-0">
                        <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-violet-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-violet-500"></span>
                        </span>
                        <span className="text-[10px] font-bold uppercase tracking-widest text-violet-400">Next-Gen Elderly Care</span>
                    </div>
                    <h1 className="text-4xl md:text-5xl xl:text-6xl font-extrabold text-white leading-[1.1] tracking-tight mb-2">Welcome to AGAP<span className="text-teal-400">AI</span></h1>
                    <p className="text-base md:text-lg text-slate-400 text-white leading-relaxed max-w-lg mb-2">Ka-AGAPAI sa Seguridad ng ating mga Lolo't Lola</p>
                    <p className="text-base md:text-lg text-slate-400 leading-relaxed max-w-lg mb-2">
                        An intelligent vision-based system providing everyday monitoring for falls and inactivity, ensuring our <span className="text-violet-300 font-semibold italic">loved ones</span> are never alone.
                    </p>
                    <div className="mt-6">
                        <span className="block text-xs font-semibold text-slate-400 mb-2">In collaboration with</span>
                        <div className="flex items-center gap-6">
                            <img src={dswdLogo} alt="DSWD" className="h-8 opacity-80" />
                            <img src={pupLogo} alt="PUP" className="h-8 opacity-80" />
                        </div>
                    </div>
                </div>
                {/* RIGHT: LOGIN CARD */}
                <div className="flex-1 flex flex-col items-center justify-center w-full max-w-sm md:max-w-xs lg:max-w-sm xl:max-w-md" style={{ marginTop: '-2rem' }}>
                    <div className="w-full p-8 md:p-8 rounded-3xl bg-slate-950/70 backdrop-blur-2xl border border-white/10 shadow-2xl flex flex-col items-center mt-0">
                        <div className="w-full">
                            <div className="text-center mb-6">
                                <h2 className="text-2xl font-bold text-white tracking-tight">LOGIN</h2>
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
                        </div>
                    </div>
                </div>
            </div>
            {/* FOOTER (copied from landing page) */}
            <footer className="relative z-10 border-t border-white/5 bg-slate-950/50 backdrop-blur-md shrink-0 mt-8 w-full">
                <div className="max-w-7xl mx-auto px-6 py-6 flex flex-col md:flex-row justify-between items-center gap-4">
                    <p className="text-xs font-medium text-slate-500 tracking-wider">
                        &copy; 2026 AGAPAI SYSTEMS. ALL RIGHTS RESERVED.
                    </p>
                    <div className="flex items-center gap-6">
                        <span className="text-[10px] font-bold text-slate-600 uppercase tracking-[0.2em]">PUP Engineering</span>
                        <div className="h-4 w-[1px] bg-slate-800"></div>
                        <span className="text-[10px] font-bold text-violet-400/80 uppercase tracking-[0.2em]">Thesis Project</span>
                    </div>
                </div>
            </footer>
        </div>
    );
}