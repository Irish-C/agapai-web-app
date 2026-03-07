import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { FaSignInAlt, FaVideo, FaChartLine, FaEnvelope, FaTimes } from 'react-icons/fa'; 
import agapaiLogo from '../assets/logo/agapai-logo.png';
import filter_bg from '../assets/bg/filter-bg.png';

export default function LandingPage() {
    const [isContactPanelOpen, setIsContactPanelOpen] = useState(false);

    const toggleContactPanel = () => setIsContactPanelOpen(!isContactPanelOpen);

    return (
        <div 
            className="h-screen w-full flex flex-col items-center justify-between p-6 md:p-10 relative overflow-hidden font-sans"
            style={{
                backgroundImage: `url(${filter_bg})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
            }}
        >
            {/* 1. SOFT OVERLAY: Keeping it light as requested to see the BG */}
            <div className="absolute inset-0 bg-slate-900/25 backdrop-blur-[1px] z-0"></div>

            {/* --- TOP NAV --- */}
            <header className="relative w-full max-w-7xl flex justify-between items-center z-50">
                <div className="flex items-center gap-3">
                    <img src={agapaiLogo} alt="Logo" className="w-10 h-10 rounded-full border-2 border-[#1b6e86] shadow-lg" />
                    <span className="text-white font-black tracking-tighter text-2xl">AGAPAI<span className="text-teal-400">.</span></span>
                </div>
                
                <button 
                    onClick={toggleContactPanel}
                    className="flex items-center px-6 py-2.5 text-[11px] font-bold tracking-[0.2em] text-white uppercase bg-[#1b6e86]/40 backdrop-blur-xl border border-teal-400/30 rounded-full hover:bg-teal-600 transition-all shadow-lg"
                >
                    <FaEnvelope className="mr-2 text-sm" />
                    Contact Us
                </button>
            </header>

            {/* --- MAIN CONTENT: Split layout to prevent scrolling --- */}
            <main className="relative z-10 w-full max-w-7xl flex flex-col lg:flex-row items-center justify-center gap-8 lg:gap-20 flex-grow py-4">
                
                {/* LEFT: Branding & Tagline */}
                <div className="flex flex-col items-center lg:items-start text-center lg:text-left max-w-xl">
                    <h1 className="text-7xl md:text-8xl font-black tracking-tighter leading-none mb-4">
                        <span className="block text-[#c4fcff]" style={{ textShadow: '3px 3px 6px rgba(0,0,0,0.3)' }}>
                            AGAP<span className="text-teal-400">AI</span>
                        </span>
                    </h1>
                    
                    <h2 className="text-xl md:text-2xl font-bold text-white mb-8 leading-tight max-w-md">
                        Ka-AGAPAI sa Seguridad ng ating mga <span className="text-teal-300">Lolo't Lola</span>
                    </h2>

                    <Link 
                        to="/login" 
                        className="group flex items-center justify-center px-10 py-4 bg-[#c4fcff] text-teal-900 text-base font-black uppercase tracking-[0.15em] rounded-full transition-all duration-300 hover:bg-white hover:scale-105 shadow-2xl active:scale-95"
                    >
                        <FaSignInAlt className="mr-3 w-5 h-5" />
                        Login to Get Started
                    </Link>
                </div>

                {/* RIGHT: Feature Cards (Compact) */}
                <div className="flex flex-col gap-4 w-full max-w-md">
                    <div className="p-6 bg-gradient-to-br from-[#2d3092]/80 to-[#015954]/80 backdrop-blur-md border border-teal-400/40 rounded-[2rem] hover:scale-[1.02] transition-transform">
                        <div className="flex items-center gap-4">
                            <div className="w-10 h-10 bg-teal-400 rounded-xl flex items-center justify-center shadow-lg shrink-0">
                                <FaVideo className="text-teal-900 text-lg" />
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-teal-300 uppercase tracking-tight">Real-Time Monitoring</h3>
                                <p className="text-gray-200 text-sm leading-snug">
                                    AI-powered detection for fall and inactivity.
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="p-6 bg-gradient-to-br from-[#2d3092]/80 to-[#015954]/80 backdrop-blur-md border border-teal-400/40 rounded-[2rem] hover:scale-[1.02] transition-transform">
                        <div className="flex items-center gap-4">
                            <div className="w-10 h-10 bg-teal-400 rounded-xl flex items-center justify-center shadow-lg shrink-0">
                                <FaChartLine className="text-teal-900 text-lg" />
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-teal-300 uppercase tracking-tight">Comprehensive Reports</h3>
                                <p className="text-gray-200 text-sm leading-snug">
                                    Detailed incident logs and care analysis.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </main>

            {/* --- COMPACT FOOTER --- */}
            <footer className="relative w-full flex justify-center py-2 text-[10px] font-bold text-white/70 uppercase tracking-[0.4em] z-10">
                &copy; 2026 AGAPAI SYSTEMS &bull; PUP Engineering Thesis
            </footer>

            {/* --- CONTACT PANEL --- */}
            <div className={`fixed inset-0 z-[100] transition-opacity duration-500 ${isContactPanelOpen ? 'opacity-100 visible' : 'opacity-0 invisible'}`}>
                <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={toggleContactPanel}></div>
                <div className={`absolute top-0 right-0 h-full w-full max-w-xs bg-white p-10 transform transition-transform duration-500 ease-in-out ${isContactPanelOpen ? 'translate-x-0' : 'translate-x-full'}`}>
                    <div className="flex justify-between items-center mb-10">
                        <h3 className="text-xl font-black text-[#2d3092] tracking-tighter">CONTACT<span className="text-teal-500">.</span></h3>
                        <button onClick={toggleContactPanel} className="w-8 h-8 flex items-center justify-center rounded-full bg-slate-100 text-slate-500 hover:text-red-500 transition-colors">
                            <FaTimes />
                        </button>
                    </div>
                    <div className="space-y-8">
                        <div>
                            <label className="text-[10px] font-bold text-teal-600 uppercase tracking-widest mb-1 block">Email</label>
                            <a href="mailto:w4makeithappen@gmail.com" className="text-sm font-bold text-slate-700 break-words">w4makeithappen@gmail.com</a>
                        </div>
                        <div>
                            <label className="text-[10px] font-bold text-teal-600 uppercase tracking-widest mb-1 block">Phone</label>
                            <a href="tel:+639506343472" className="text-sm font-bold text-slate-700">+63 950 634 3472</a>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}