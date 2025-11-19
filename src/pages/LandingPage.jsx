import { useState } from 'react'; 
import { Link } from 'react-router-dom';
import { FaUserCircle, FaSignInAlt, FaVideo, FaChartLine, FaEnvelope, FaTimes, FaPhoneAlt } from 'react-icons/fa'; 

import agapaiLogo from './../assets/images/logos/agapai-logo.png';
import filter_bg from './../assets/images/bg/filter-bg.png';

export default function LandingPage() {
    const [isContactPanelOpen, setIsContactPanelOpen] = useState(false);

    const toggleContactPanel = () => {
        setIsContactPanelOpen(!isContactPanelOpen);
    };

    return (
        <div 
            className="min-h-screen flex flex-col relative overflow-hidden"
            style={{
                backgroundImage: `url(${filter_bg})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                backgroundAttachment: 'fixed'
            }}
        >
            {/* Dark overlay for better text readability on the background */}
            <div className="absolute inset-0 bg-opacity-20"></div>

            {/* -------------------------------------------------- */}
            {/* CONTACT BUTTON (Top Right) */}
            {/* -------------------------------------------------- */}
            <div className="absolute top-6 right-6 z-50">
                <button 
                    onClick={toggleContactPanel} 
                    className="flex items-center px-5 py-2.5 text-sm font-bold tracking-wide text-white bg-teal-800 bg-opacity-80 rounded-full shadow-lg hover:bg-teal-600 backdrop-blur-sm transition duration-300 border border-teal-400/30"
                >
                    <FaEnvelope className="mr-2" />
                    CONTACT US
                </button>
            </div>

            {/* -------------------------------------------------- */}
            {/* SLIDE-IN CONTACT PANEL */}
            {/* -------------------------------------------------- */}
            {isContactPanelOpen && (
                <div 
                    className="fixed inset-0 bg-black z-40 transition-opacity duration-300"
                    onClick={toggleContactPanel} 
                    style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }} 
                ></div>
            )}

            <div
                className={`fixed top-0 right-0 h-full w-80 bg-white shadow-2xl p-6 transform transition-transform duration-500 ease-in-out z-50
                    ${isContactPanelOpen ? 'translate-x-0' : 'translate-x-full'}`}
            >
                <div className="flex justify-between items-center border-b pb-4 mb-6">
                    <h3 className="text-xl font-bold text-teal-700">Get in Touch</h3>
                    <button onClick={toggleContactPanel} className="text-gray-400 hover:text-red-500 transition-colors">
                        <FaTimes className="w-6 h-6" />
                    </button>
                </div>

                <div className="space-y-8">
                    <div>
                        <h4 className="flex items-center text-md font-bold text-gray-800 mb-2">
                            <FaEnvelope className="mr-3 text-teal-600" /> Email Us
                        </h4>
                        <a href="mailto:w4makeithappen@gmail.com" className="block text-gray-600 hover:text-teal-600 transition duration-300 text-sm ml-7">
                            w4makeithappen@gmail.com
                        </a>
                    </div>
                    <div>
                        <h4 className="flex items-center text-md font-bold text-gray-800 mb-2">
                            <FaPhoneAlt className="mr-3 text-teal-600" /> Call Us
                        </h4>
                        <a href="tel:+639506343472" className="block text-gray-600 hover:text-teal-600 transition duration-300 text-sm ml-7">
                            +63 950 634 3472
                        </a>
                        <p className="text-xs text-gray-400 mt-1 ml-7">(Available during business hours)</p>
                    </div>
                    <div className="pt-8 border-t">
                        <p className="text-sm text-gray-500 italic leading-relaxed">
                            "We look forward to partnering with you for a safer elderly care environment."
                        </p>
                    </div>
                </div>
            </div>

            {/* -------------------------------------------------- */}
            {/* MAIN CONTENT: Split Layout */}
            {/* -------------------------------------------------- */}
            <div className="flex-grow flex items-center justify-center z-20 px-6 py-12">
                <div className="max-w-7xl w-full mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
                    
                    {/* LEFT SIDE: Text, Buttons, Features */}
                    {/* order-2 on mobile (so logo is first), order-1 on desktop (so text is left) */}
                    <div className="order-2 lg:order-1 text-center lg:text-left text-white space-y-6">
                        
                        <div>
                            <h1 className="font-extrabold tracking-tight">
                                <span className="block text-[#c4fcff] text-7xl md:text-9xl leading-tight drop-shadow-lg">
                                    AGAP<span className="text-teal-400">AI</span>
                                </span>
                            </h1>
                            <h2 className="text-xl md:text-2xl font-medium mt-2 tracking-wide text-teal-100">
                                Ka-AGAPAI sa Seguridad ng ating mga Lolo't Lola
                            </h2>
                            <p className="text-lg md:text-xl font-light italic text-gray-200 max-w-xl mx-auto lg:mx-0 mt-4">
                                A Vision-Based Monitoring and Alert System for Fall and Inactivity in Elderly Care Facility
                            </p>
                        </div>

                        <div className="pt-4">
                            <Link 
                                to="/login" 
                                className="inline-flex items-center justify-center px-8 py-4 text-lg font-bold text-teal-900 bg-[#c4fcff] rounded-full shadow-[0_0_20px_rgba(196,252,255,0.5)] hover:bg-white hover:scale-105 transition-all duration-300 group"
                            >
                                <FaSignInAlt className="mr-3 w-5 h-5 group-hover:animate-bounce" />
                                Login to Get Started
                            </Link>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-8 max-w-2xl mx-auto lg:mx-0">
                            <div className="p-5 bg-gradient-to-br from-[#2d3092]/80 to-[#015954]/80 border border-teal-400/50 rounded-xl backdrop-blur-sm hover:border-teal-300 transition-colors">
                                <h3 className="flex items-center justify-center lg:justify-start text-lg font-bold text-teal-300 mb-2">
                                    <FaVideo className="mr-2" /> Real-Time Monitoring
                                </h3>
                                <p className="text-sm text-gray-200 leading-snug">
                                    Secure video streaming with low-latency AI processing for immediate incident detection.
                                </p>
                            </div>
                            <div className="p-5 bg-gradient-to-br from-[#2d3092]/80 to-[#015954]/80 border border-teal-400/50 rounded-xl backdrop-blur-sm hover:border-teal-300 transition-colors">
                                <h3 className="flex items-center justify-center lg:justify-start text-lg font-bold text-teal-300 mb-2">
                                    <FaChartLine className="mr-2" /> Comprehensive Reporting
                                </h3>
                                <p className="text-sm text-gray-200 leading-snug">
                                    Historical data logs, activity summaries, and customizable reports for long-term analysis.
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* RIGHT SIDE: Logo */}
                    {/* order-1 on mobile (logo on top), order-2 on desktop (logo on right) */}
                    <div className="order-1 lg:order-2 flex flex-col items-center justify-center relative">
                        <div className="relative inline-block group">
                            {/* Logo Image */}
                            <div className="relative z-10 rounded-full p-2 bg-white/10 backdrop-blur-md border border-white/20 shadow-2xl">
                                <img 
                                    src={agapaiLogo} 
                                    alt="AGAPAI Logo" 
                                    className="w-64 h-64 md:w-80 md:h-80 rounded-full object-cover border-4 border-[#1b6e86] shadow-inner cursor-help transition duration-500 transform group-hover:scale-105" 
                                    onError={(e) => { e.target.onerror = null; e.target.src="/placeholder-logo.png" }}
                                />
                            </div>

                            {/* Tooltip: Positioned BELOW the logo now */}
                            <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-6 w-72 p-4 rounded-xl shadow-2xl bg-white/95 text-gray-800 text-sm backdrop-blur-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 z-20 border border-teal-100">
                                {/* Tooltip Arrow */}
                                <div className="absolute -top-2 left-1/2 transform -translate-x-1/2 w-4 h-4 bg-white rotate-45"></div>
                                <p className="font-bold text-teal-700 mb-1 text-center uppercase tracking-wider">Name Origin</p>
                                <p className="text-center leading-relaxed">
                                    From <span className="font-semibold text-teal-600">“Agap”</span> (quick response) and <span className="font-semibold text-teal-600">“AI,”</span> forming <span className="font-semibold text-teal-600">“Agapay”</span> (Filipino for support).
                                </p>
                            </div>
                        </div>
                    </div>

                </div>
            </div>

            <footer className="relative py-4 text-center text-xs text-teal-200/60 z-20">
                &copy; 2024 AGAPAI Project | Developed for Elder Care
            </footer>
        </div>
    );
}