import React from 'react';
import { Link } from 'react-router-dom';
import { FaUserCircle, FaSignInAlt, FaCamera, FaChartLine } from 'react-icons/fa';

// Assets path updated based on the new hierarchy
const logoPath = '/assets/images/logo/agapai-logo.png'; 
const bgImagePath = '/assets/images/bg/og-bg.png'; 

export default function LandingPage() {
  return (
    <div 
        className="min-h-screen flex flex-col items-center justify-center p-4"
        style={{
            backgroundImage: `url(${bgImagePath})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundAttachment: 'fixed'
        }}
    >
        <div className="relative z-10 w-full max-w-md bg-white p-8 rounded-2xl shadow-2xl backdrop-blur-sm"></div>
        
        <div className="relative text-center text-white z-10 p-8 md:p-12 bg-gray-900 bg-opacity-80 rounded-2xl shadow-2xl max-w-4xl mx-auto backdrop-blur-sm">
            <img src={logoPath} alt="AGAPAI Logo" className="w-24 h-24 mx-auto mb-6 rounded-full border-4 border-teal-500 shadow-lg" 
                 onError={(e) => { e.target.onerror = null; e.target.src="/placeholder-logo.png" }}/>
            
            <h1 className="text-4xl md:text-6xl font-extrabold mb-4 tracking-tight">
                AGAPAI <span className="text-teal-400">Monitoring</span> System
            </h1>
            <p className="text-xl md:text-2xl font-light mb-8 max-w-2xl mx-auto">
                AI-Powered Fall Detection and Elderly Care Monitoring.
            </p>

            <div className="flex flex-col md:flex-row space-y-4 md:space-y-0 md:space-x-6 justify-center">
                
                <Link 
                    to="/login" 
                    className="flex items-center justify-center px-8 py-3 text-lg font-semibold text-white bg-teal-600 rounded-xl shadow-lg hover:bg-teal-700 transition duration-300 transform hover:scale-105 group"
                >
                    <FaSignInAlt className="mr-3 w-5 h-5 group-hover:animate-pulse" />
                    Log In to Dashboard
                </Link>

                <Link 
                    to="/about" 
                    className="flex items-center justify-center px-8 py-3 text-lg font-semibold text-teal-400 border-2 border-teal-500 rounded-xl shadow-lg hover:bg-teal-900 transition duration-300 transform hover:scale-105"
                >
                    <FaUserCircle className="mr-3 w-5 h-5" />
                    About AGAPAI
                </Link>
            </div>

            <div className="mt-12 grid grid-cols-1 md:grid-cols-2 gap-8 text-left">
                <div className="p-4 bg-gray-800 bg-opacity-70 rounded-xl border border-gray-700">
                    <h3 className="flex items-center text-xl font-bold text-teal-400 mb-2">
                        <FaCamera className="mr-2" /> Real-Time Monitoring
                    </h3>
                    <p className="text-sm text-gray-300">
                        Secure video streaming with low-latency AI processing for immediate incident detection.
                    </p>
                </div>
                <div className="p-4 bg-gray-800 bg-opacity-70 rounded-xl border border-gray-700">
                    <h3 className="flex items-center text-xl font-bold text-teal-400 mb-2">
                        <FaChartLine className="mr-2" /> Comprehensive Reporting
                    </h3>
                    <p className="text-sm text-gray-300">
                        Historical data logs, activity summaries, and customizable reports for long-term analysis.
                    </p>
                </div>
            </div>
        </div>

        {/* Footer style placeholder - usually handled by the main app layout */}
        <footer className="relative mt-8 text-xs text-gray-400 z-10">
            &copy; 2024 AGAPAI Project | Developed for Elder Care
        </footer>
    </div>
  );
}
