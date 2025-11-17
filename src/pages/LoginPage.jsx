// src/pages/LoginPage.jsx
import React, { useState } from 'react';
import { FaLock, FaSignInAlt, FaUser, FaKey, FaSpinner } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';

// Assets path updated based on the new hierarchy
import og_bg from './../assets/images/bg/filter-bg.png';
import agapaiLogo from './../assets/images/logos/agapai-logo.png';
import dswdLogo from './../assets/images/logos/dswd-logo.png'; 
import pupLogo from './../assets/images/logos/pup-logo.png'; 

// LoginPage now receives the asynchronous 'login' function from App.jsx
export default function LoginPage({ login }) {
    // 🛑 FIX: Removed hardcoded default credentials to force manual input
    const [username, setUsername] = useState(''); 
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
        const result = await login(username, password);

        if (result.success) {
        navigate('/dashboard');
        return;
        } else {
        setError(result.message || 'Login failed. Invalid credentials.');
        }
    } catch (err) {
        console.error('Login submission error:', err);
        setError(err.message || 'An unexpected error occurred during login.');
    } finally {
        setIsLoading(false);
    }
    };
    
    return (
        <div 
            className="min-h-screen flex items-center justify-center p-4 sm:p-6"
            style={{
                backgroundImage: `url(${og_bg})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                backgroundAttachment: 'fixed',
            }}
        >
            <div className="absolute inset-0 bg-black opacity-20"></div>
            
            <div className="relative w-full max-w-md p-8 shadow-2xl backdrop-blur-sm 
                bg-gradient-to-b from-[#2d3092] to-[#015954]
                rounded-xl text-white text-left">
                
                {/* Logo and Title */}
                <div className="text-center mb-8">
                    <img src={agapaiLogo} alt="AGAPAI Logo" className="w-20 h-20 mx-auto mb-4 rounded-full border-2 border-teal-500 shadow-md" 
                            onError={(e) => { e.target.onerror = null; e.target.src="/placeholder-logo.png" }}/>
                    <h2 className="text-3xl font-bold white">LOGIN</h2>
                    <p className="text-sm text-white mt-2">Access the <span className="font-bold text-teal-400">AGAPAI</span> Dashboard</p>
                </div>

                {/* Login Form */}
                <form onSubmit={handleSubmit}>
                    
                    {/* Error Message */}
                    {error && (
                        <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded-lg text-sm flex items-center">
                            <FaLock className="mr-2" /> {error}
                        </div>
                    )}

                    {/* Username Input */}
                    <div className="mb-4">
                        <label className="block text-gray-100 text-sm font-semibold mb-2" htmlFor="username">
                            <FaUser className="inline-block mr-2 text-teal-600" />
                            Username
                        </label>
                        <input
                            type="text"
                            id="username"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            className="shadow appearance-none border rounded-xl w-full py-3 px-4 text-gray-100 leading-tight focus:outline-none focus:ring-2 focus:ring-teal-500 transition duration-150"
                            placeholder="Enter your username"
                            required
                        />
                    </div>

                    {/* Password Input */}
                    <div className="mb-6">
                        <label className="block text-gray-100 text-sm font-semibold mb-2" htmlFor="password">
                            <FaKey className="inline-block mr-2 text-teal-600" />
                            Password
                        </label>
                        <input
                            type="password"
                            id="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="shadow appearance-none border rounded-xl w-full py-3 px-4 text-gray-100 mb-3 leading-tight focus:outline-none focus:ring-2 focus:ring-teal-500 transition duration-150"
                            placeholder="********"
                            required
                        />
                    </div>

                    {/* Submit Button */}
                    <div className="flex items-center justify-between">
                        <button
                            type="submit"
                            disabled={isLoading}
                            className={`w-full flex items-center justify-center text-white font-bold py-3 px-4 rounded-xl transition duration-300 ${
                                isLoading ? 'bg-teal-400 cursor-not-allowed' : 'bg-teal-600 hover:bg-teal-700 shadow-md hover:shadow-lg transform hover:scale-[1.01]'
                            }`}
                        >
                            {isLoading ? (
                                <>
                                    <FaSpinner className="animate-spin mr-2" />
                                    Authenticating...
                                </>
                            ) : (
                                <>
                                    <FaSignInAlt className="mr-2" />
                                    LOGIN
                                </>
                            )}
                        </button>
                    </div>
                </form>

                {/* Affiliation Logos */}
                <div className="mt-8 pt-6 border-t border-gray-200 flex justify-around items-center space-x-4">
                    <img src={dswdLogo} alt="DSWD Logo" className="h-10 w-auto opacity-70"
                            onError={(e) => { e.target.onerror = null; e.target.src="/placeholder-logo.png" }}/>
                    <img src={pupLogo} alt="PUP Logo" className="h-10 w-auto opacity-70" 
                            onError={(e) => { e.target.onerror = null; e.target.src="/placeholder-logo.png" }}/>
                </div>
            </div>
        </div>
    );
}