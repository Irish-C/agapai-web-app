// src/pages/LandingPage.jsx
import { Link } from 'react-router-dom';
import { FaUserCircle, FaSignInAlt, FaCamera, FaChartLine } from 'react-icons/fa';

import agapaiLogo from './../assets/images/logos/agapai-logo.png';
import filter_bg from './../assets/images/bg/filter-bg.png';

export default function LandingPage() {
  return (
    <div 
        className="min-h-screen flex flex-col items-center justify-center p-4"
        style={{
            backgroundImage: `url(${filter_bg})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundAttachment: 'fixed'
        }}
    >
        
        <div className="relative text-center text-white z-8 p-4 md:p-6 bg-opacity-100 rounded-2xl max-w-4xl mx-auto">
            <img src={agapaiLogo} alt="AGAPAI Logo" className="w-40 h-40 mx-auto mb-2 rounded-full border-4 border-[#1b6e86] shadow-lg" 
                 onError={(e) => { e.target.onerror = null; e.target.src="/placeholder-logo.png" }}/>
            
            <h1 className="text-8xl font-extrabold tracking-tight text-center">
            <span className="block text-[#c4fcff] text-9xl font-extrabold" 
                style={{ textShadow: '4px 4px 8px #334a4bff' }}>
                AGAP<span className="text-teal-400">AI</span>
            </span>
            </h1>
            <h2 className="text-1xl font-regular mb-4 ttracking-tight text-center">
                <span className="block">Ka-AGAPAI sa Seguridad ng ating mga Lolo't Lola </span>
            </h2>
            <p className="text-1xl font-light italic mb-12 max-w-2xl mx-auto text-center">
                A Vision-Based Monitoring and Alert System for Fall and Inactivity in Elderly Care Facility
            </p>

            <div className="flex flex-col md:flex-row space-y-4 md:space-y-0 md:space-x-6 justify-center">
                
                <Link 
                    to="/login" 
                    className="flex items-center justify-center px-8 py-3 text-lg font-semibold text-teal-900 bg-[#c4fcff] rounded-full shadow-lg hover:bg-teal-700 transition duration-300 transform hover:scale-105 group"
                >
                    <FaSignInAlt className="mr-3 w-6 h-6 group-hover:animate-pulse" />
                    Login to Get Started
                </Link>

                {/*
                <Link 
                    to="/about" 
                    className="flex items-center justify-center px-8 py-3 text-lg font-semibold text-teal-400 border-2 border-teal-500 rounded-xl shadow-lg hover:bg-teal-900 transition duration-300 transform hover:scale-105"
                >
                    <FaUserCircle className="mr-3 w-5 h-5" />
                    About AGAPAI
                </Link>*/}
            </div>

            <div className="mt-12 grid grid-cols-1 md:grid-cols-2 gap-8 text-left">
                <div className="p-4 bg-opacity-70 rounded-xl bg-gradient-to-b from-[#2d3092] to-[#015954] border border-teal-400">
                    <h3 className="flex items-center text-xl font-bold text-teal-400 mb-2">
                        <FaCamera className="mr-2" /> Real-Time Monitoring
                    </h3>
                    <p className="text-sm text-gray-300">
                        Secure video streaming with low-latency AI processing for immediate incident detection.
                    </p>
                </div>
                <div className="p-4 bg-opacity-70 rounded-xl bg-gradient-to-b from-[#2d3092] to-[#015954] border border-teal-400">
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
        <footer className="relative mt-4 text-xs text-gray-400 z-10">
            &copy; 2024 AGAPAI Project | Developed for Elder Care
        </footer>
    </div>
  );
}

