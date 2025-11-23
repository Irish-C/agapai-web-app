import { useState } from 'react'; // Import useState
import { Link } from 'react-router-dom';
import { FaUserCircle, FaSignInAlt, FaVideo, FaChartLine, FaEnvelope, FaTimes, FaPhoneAlt } from 'react-icons/fa'; // Added FaTimes, FaPhoneAlt

import agapaiLogo from './../assets/images/logos/agapai-logo.png';
import filter_bg from './../assets/images/bg/filter-bg.png';
import elderNurse from './../assets/images/bg/elder-nurse.png';

export default function LandingPage() {
    // 1. State to control the visibility of the contact panel
    const [isContactPanelOpen, setIsContactPanelOpen] = useState(false);

    const toggleContactPanel = () => {
        setIsContactPanelOpen(!isContactPanelOpen);
    };

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

            {/* -------------------------------------------------- */}
            {/* 2. CONTACT BUTTON (Trigger) - TOP RIGHT CORNER */}
            {/* -------------------------------------------------- */}
            <div className="absolute top-4 right-4 z-50">
                <button 
                    onClick={toggleContactPanel} // Use onClick to toggle the state
                    className="flex items-center px-4 py-2 text-sm font-semibold text-white rounded-full shadow-lg hover:bg-teal-700 transition duration-300"
                >
                    <FaEnvelope className="mr-2" />
                    CONTACT US
                </button>
            </div>


            {/* -------------------------------------------------- */}
            {/* 3. SLIDE-IN CONTACT PANEL (Sidebar) */}
            {/* -------------------------------------------------- */}
            {isContactPanelOpen && (
                <div 
                    className="fixed inset-0 bg-black z-40"
                    onClick={toggleContactPanel} 
                    // Inline style to manually set the black background transparency
                    style={{ backgroundColor: 'rgba(0, 0, 0, 0.3)' }} // 0.3 = 30% opacity
                ></div>
            )}

            <div
                className={`fixed top-0 right-0 h-full w-80 bg-white shadow-2xl p-6 transform transition-transform duration-500 ease-in-out z-50
                    ${isContactPanelOpen ? 'translate-x-0' : 'translate-x-full'}`}
            >
                {/* Header and Close Button */}
                <div className="flex justify-between items-center border-b pb-4 mb-6">
                    <h3 className="text-xl font-bold text-teal-700">Get in Touch</h3>
                    <button onClick={toggleContactPanel} className="text-gray-500 hover:text-red-500">
                        <FaTimes className="w-6 h-6" />
                    </button>
                </div>

                {/* Contact Content */}
                <div className="space-y-6">
                    <div>
                        <h4 className="flex items-center text-md font-semibold text-gray-800 mb-2">
                            <FaEnvelope className="mr-2 text-teal-600" /> Email Us
                        </h4>
                        <a 
                            href="mailto:w4makeithappen@gmail.com" 
                            className="text-gray-600 hover:text-teal-600 transition duration-300 text-sm"
                        >
                            w4makeithappen@gmail.com
                        </a>
                    </div>

                    <div>
                        <h4 className="flex items-center text-md font-semibold text-gray-800 mb-2">
                            <FaPhoneAlt className="mr-2 text-teal-600" /> Call Us
                        </h4>
                        <a 
                            href="tel:+639123456789" // Example phone number
                            className="text-gray-600 hover:text-teal-600 transition duration-300 text-sm"
                        >
                            +63 950 634 3472
                        </a>
                        <p className="text-xs text-gray-400 mt-1">(Available during business hours)</p>
                    </div>

                    <div className="pt-4">
                        <p className="text-sm text-gray-500 italic">
                            We look forward to partnering with you for a safer elderly care environment.
                        </p>
                    </div>
                </div>

            </div>

            {/* --- REST OF THE ORIGINAL LANDING PAGE CONTENT --- */}
            <div className="relative text-center text-white z-20 p-4 md:p-6 bg-opacity-100 rounded-2xl max-w-4xl mx-auto">
                {/* ... ( Logo and Floating Bubble Code) ... */}

                <div className="relative inline-block group mb-2">
                    <img 
                        src={agapaiLogo} 
                        alt="AGAPAI Logo" 
                        className="w-40 h-40 mx-auto rounded-full border-4 border-[#1b6e86] shadow-lg cursor-help transition duration-300 transform group-hover:scale-105" 
                        onError={(e) => { e.target.onerror = null; e.target.src="/placeholder-logo.png" }}
                    />
                    <div className="absolute top-1/2 left-full transform -translate-y-1/2 ml-4 w-64 p-3 rounded-lg shadow-xl bg-gray-250 text-gray-50 text-sm font-regular opacity-0 invisible group-hover:opacity-100 group-hover:visible transition duration-300 pointer-events-none z-20">
                        <p className="font-bold text-teal-500 mb-1">AGAPAI Name Origin</p>
                        <p>From “Agap” (quick response) and “AI,” forming “Agapay” (Filipino for support), representing constant and vigilant care.</p>
                    </div>
                </div>
                
                <h1 className="text-8xl font-extrabold tracking-tight text-center">
                <span className="block text-[#c4fcff] text-9xl font-extrabold" 
                    style={{ textShadow: '4px 4px 8px #334a4bff' }}>
                        AGAP<span className="text-teal-400">AI</span>
                </span>
                </h1>
                <h2 className="text-1xl font-regular mb-4 tracking-tight text-center">
                    <span className="block">Ka-AGAPAI sa Seguridad ng ating mga Lolo't Lola </span>
                </h2>
                <p className="text-1xl font-light italic mb-12 max-w-2xl z-50 mx-auto text-center">
                    A Vision-Based Monitoring and Alert System for Fall and Inactivity in Elderly Care Facility
                </p>

                <div className="flex flex-col md:flex-row space-y-4 md:space-y-0 md:space-x-6 justify-center">
                    <Link 
                        to="/login" 
                        className="flex items-center justify-center px-8 py-3 text-lg z-20 font-semibold text-teal-900 bg-[#c4fcff] rounded-full shadow-lg hover:bg-teal-700 transition duration-300 transform hover:scale-105 group"
                    >
                        <FaSignInAlt className="mr-3 w-6 h-6 group-hover:animate-pulse" />
                        Login to Get Started
                    </Link>
                </div>

                <div className="mt-12 grid grid-cols-1 md:grid-cols-2 gap-8 text-left">
                    <div className="p-4 bg-opacity-70 rounded-xl bg-gradient-to-b from-[#2d3092] to-[#015954] border border-teal-400 z-20">
                        <h3 className="flex items-center text-xl font-bold text-teal-400 mb-2">
                            <FaVideo className="mr-2" /> Real-Time Monitoring
                        </h3>
                        <p className="text-sm text-gray-300">
                            Secure video streaming with low-latency AI processing for immediate incident detection.
                        </p>
                    </div>
                    <div className="p-4 bg-opacity-70 rounded-xl bg-gradient-to-b from-[#2d3092] to-[#015954] border border-teal-400 z-20">
                        <h3 className="flex items-center text-xl font-bold text-teal-400 mb-2">
                            <FaChartLine className="mr-2" /> Comprehensive Reporting
                        </h3>
                        <p className="text-sm text-gray-300">
                            Historical data logs, activity summaries, and customizable reports for long-term analysis.
                        </p>
                    </div>
                </div>
            </div>

            <footer className="relative mt-4 text-xs text-gray-400 z-10">
                &copy; 2024 AGAPAI Project | Developed for Elder Care
            </footer>
        </div>
    );
}   