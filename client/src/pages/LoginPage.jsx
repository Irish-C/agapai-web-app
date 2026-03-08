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

        // Input validation
        if (!username.trim() || !password.trim()) {
            setError('Username and password are required.');
            setIsLoading(false);
            return;
        }

        try {
            // Call context login function (decoupled API)
            const result = await login(username, password);

            // HTTP status mapping
            if (result.success) {
                navigate('/dashboard');
            } else {
                // Custom error mapping
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
        <div className="min-h-screen flex items-center justify-center bg-slate-900 text-slate-200 relative overflow-hidden">

            {/* Background image */}
            <div
                className="fixed inset-0 opacity-80"
                style={{
                    backgroundImage: `url(${filter_bg})`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center'
                }}
            />

            {/* Soft gradient overlay */}
            <div className="fixed inset-0 bg-gradient-to-b from-slate-900/60 via-slate-800/40 to-slate-900/70"></div>

            {/* Back to Home Button */}
            <button 
                onClick={goToLandingPage}
                className="absolute top-8 left-8 z-20 flex items-center gap-2 text-slate-300 hover:text-teal-300 transition-colors group"
            >
                <FaArrowLeft className="group-hover:-translate-x-1 transition-transform" />
                <span className="font-medium">Back to Home</span>
            </button>

            {/* Dual Glow Effect */}
            <div className="absolute w-[500px] h-[500px] bg-teal-400/20 blur-3xl rounded-full top-1/2 left-[40%] -translate-x-1/2 -translate-y-1/2"></div>
            <div className="absolute w-[500px] h-[500px] bg-violet-400/20 blur-3xl rounded-full top-1/2 left-[60%] -translate-x-1/2 -translate-y-1/2"></div>
            
            {/* Login Card */}
            <div className={
                `relative z-10 w-full max-w-md p-10 rounded-2xl bg-white/10 backdrop-blur-xl border border-white/20 shadow-2xl ${error ? 'animate-shake' : ''}`
            }>

                {/* Logo */}
                <div className="text-center mb-8">
                    <div
                        onClick={goToLandingPage}
                        className="cursor-pointer inline-block"
                    >
                        <img
                            src={agapaiLogo}
                            alt="AGAPAI Logo"
                            className="w-20 h-20 mx-auto mb-4 rounded-full 
                            shadow-[0_0_30px_rgba(45,212,191,0.45)] 
                            hover:scale-105 transition"
                        />
                    </div>

                    <h2 className="text-3xl font-bold text-white">
                        LOGIN
                    </h2>

                    <p className="text-sm text-slate-300 mt-2">
                        Access the <span className="text-teal-300 font-semibold">AGAPAI</span> Dashboard
                    </p>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="space-y-6">

                    {error && (
                        <div className="p-3 bg-red-500/20 border border-red-400/30 text-red-200 rounded-xl text-sm flex items-center">
                            <FaLock className="mr-2" /> {error}
                        </div>
                    )}

                    {/* Username */}
                    <div>
                        <label htmlFor="login-username" className="block text-sm text-slate-300 mb-2">
                            <FaUser className="inline mr-2 text-teal-300" />
                            Username
                        </label>
                        <input
                            id="login-username"
                            name="username"
                            type="text"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            required
                            placeholder="Enter username"
                            className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-slate-400 focus:outline-none focus:border-teal-300 transition"
                        />
                    </div>

                    {/* Password */}
                    <div>
                        <label htmlFor="login-password" className="block text-sm text-slate-300 mb-2">
                            <FaKey className="inline mr-2 text-teal-300" />
                            Password
                        </label>
                        <div className="relative">
                            <input
                                id="login-password"
                                name="password"
                                type={showPassword ? "text" : "password"}
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                placeholder="********"
                                className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-slate-400 focus:outline-none focus:border-teal-300 transition pr-12"
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword((prev) => !prev)}
                                className="absolute top-1/2 right-3 transform -translate-y-1/2 text-teal-300 hover:text-teal-400 focus:outline-none"
                                tabIndex={-1}
                                aria-label={showPassword ? "Hide password" : "Show password"}
                            >
                                {showPassword ? <FaEyeSlash /> : <FaEye />}
                            </button>
                        </div>
                    </div>

                    {/* Button */}
                    <button
                        type="submit"
                        disabled={isLoading}
                        className={`w-full py-4 font-bold rounded-xl flex items-center justify-center gap-2 transition-all ${
                            isLoading
                                ? 'bg-teal-300 cursor-not-allowed'
                                : 'bg-teal-500 hover:bg-teal-300 text-slate-900 shadow-lg shadow-teal-500/30'
                        }`}
                    >
                        {isLoading ? (
                            <>
                                <FaSpinner className="animate-spin" />
                                Authenticating...
                            </>
                        ) : (
                            <>
                                <FaSignInAlt />
                                LOGIN
                            </>
                        )}
                    </button>
                </form>

                {/* Affiliation Logos */}
                <div className="mt-10 pt-6 border-t border-white/10 flex justify-center items-center gap-6">
                    <img src={dswdLogo} alt="DSWD Logo" className="h-10 opacity-90" />
                    <img src={pupLogo} alt="PUP Logo" className="h-10 opacity-90" />
                </div>
            </div>
        </div>
    );
}