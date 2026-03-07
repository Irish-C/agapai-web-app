import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { FaSignInAlt, FaVideo, FaChartLine, FaEnvelope, FaTimes, FaCircle } from 'react-icons/fa'; 
import agapaiLogo from '../assets/logo/agapai-logo.png';
import filter_bg from '../assets/bg/filter-bg.png';

export default function LandingPage() {
    const [isContactPanelOpen, setIsContactPanelOpen] = useState(false);

    const toggleContactPanel = () => setIsContactPanelOpen(!isContactPanelOpen);

    return (
        <div 
            className="h-screen w-full flex flex-col items-center relative overflow-hidden font-sans selection:bg-teal-500/30"
            style={{
                backgroundImage: `url(${filter_bg})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
            }}
        >
            {/* ATMOSPHERIC OVERLAY */}
            <div className="absolute inset-0 bg-slate-900/20 backdrop-blur-[1.5px] z-0"></div>
            <div className="absolute inset-0 bg-gradient-to-tr from-[#2d3092]/30 via-transparent to-[#015954]/30 z-0"></div>

            {/* --- TOP NAV --- */}
            <header className="relative w-full max-w-7xl flex justify-between items-center px-10 py-8 z-50">
                <div className="flex items-center gap-4 group cursor-default">
                    <img src={agapaiLogo} alt="Logo" className="w-10 h-10 rounded-full border border-white/30 shadow-2xl transition-transform group-hover:scale-110" />
                    <span className="text-white font-black tracking-tighter text-2xl uppercase">AGAPAI<span className="text-teal-400">.</span></span>
                </div>
                
                <button 
                    onClick={toggleContactPanel}
                    className="group flex items-center px-6 py-2.5 text-[10px] font-black tracking-[0.3em] text-white uppercase bg-white/5 backdrop-blur-2xl border border-white/10 rounded-full hover:bg-teal-500 transition-all shadow-2xl"
                >
                    <FaEnvelope className="mr-3 text-xs" />
                    Connect
                </button>
            </header>

            {/* --- MAIN STAGE --- */}
            <main className="relative z-10 w-full max-w-7xl flex-grow flex items-center px-10">
                <div className="grid grid-cols-12 gap-12 w-full items-center">
                    
                    {/* LEFT CONTENT: Identity */}
                    <div className="col-span-12 lg:col-span-7 flex flex-col items-center lg:items-start text-center lg:text-left">
                        <div className="inline-flex items-center gap-2 px-3 py-1 mb-6 rounded-full bg-teal-400/10 border border-teal-400/20 backdrop-blur-md">
                            <FaCircle className="text-[6px] text-teal-400 animate-pulse" />
                            <span className="text-[9px] font-black uppercase tracking-[0.3em] text-teal-300">System Active</span>
                        </div>

                        <h1 className="text-8xl md:text-[9.5rem] font-black tracking-tighter leading-[0.8] mb-6">
                            <span className="block text-[#c4fcff] drop-shadow-2xl">AGAP<span className="text-teal-400">AI</span></span>
                        </h1>
                        
                        <div className="max-w-lg space-y-8">
                            <div>
                                <h2 className="text-xl md:text-2xl font-bold text-white leading-snug mb-2">
                                    Ka-AGAPAI sa Seguridad ng ating mga <span className="text-teal-400">Lolo't Lola</span>
                                </h2>
                                <p className="text-sm md:text-base text-gray-200 font-medium italic opacity-90 leading-relaxed">
                                    A Vision-Based Monitoring and Alert System for Fall and Inactivity in Elderly Care Facility
                                </p>
                            </div>

                            <Link 
                                to="/login" 
                                className="inline-flex items-center justify-center px-14 py-5 bg-[#c4fcff] text-teal-900 text-xs font-black uppercase tracking-[0.3em] rounded-full transition-all duration-300 hover:bg-white hover:shadow-[0_0_50px_rgba(196,252,255,0.4)] hover:-translate-y-1 active:scale-95"
                            >
                                <FaSignInAlt className="mr-3 text-lg" />
                                Get Started
                            </Link>
                        </div>
                    </div>

                    {/* RIGHT CONTENT: Fixed-Width Overlapping Cards */}
                    <div className="hidden lg:col-span-5 lg:flex flex-col gap-6 relative items-end">
                        <div className="absolute -inset-20 bg-teal-500/10 rounded-full blur-[100px] z-0 pointer-events-none"></div>

                        {/* Card 1: Vision Monitoring */}
                        <div className="relative group p-8 bg-gradient-to-br from-white/10 to-transparent backdrop-blur-2xl border border-white/10 rounded-[2.5rem] shadow-2xl transition-all hover:bg-white/15 hover:-translate-x-3 w-[400px]">
                            <div className="flex gap-6">
                                <div className="w-14 h-14 bg-teal-400 text-teal-950 rounded-2xl flex items-center justify-center shadow-lg shrink-0">
                                    <FaVideo size={24} />
                                </div>
                                <div className="flex-1">
                                    <h3 className="text-sm font-black text-teal-300 uppercase tracking-widest mb-2">Sentinel Vision</h3>
                                    <p className="text-gray-200 text-sm leading-relaxed font-medium">
                                        The system watches for falls or long periods of inactivity and alerts the staff immediately through a live stream.
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Card 2: Reporting (Same width as above) */}
                        <div className="relative group p-8 bg-gradient-to-br from-white/10 to-transparent backdrop-blur-2xl border border-white/10 rounded-[2.5rem] shadow-2xl transition-all hover:bg-white/15 hover:-translate-x-3 w-[400px] mr-12">
                            <div className="flex gap-6">
                                <div className="w-14 h-14 bg-teal-400 text-teal-950 rounded-2xl flex items-center justify-center shadow-lg shrink-0">
                                    <FaChartLine size={24} />
                                </div>
                                <div className="flex-1">
                                    <h3 className="text-sm font-black text-teal-300 uppercase tracking-widest mb-2">Audit Intelligence</h3>
                                    <p className="text-gray-200 text-sm leading-relaxed font-medium">
                                        Keep track of everything that happens with clear logs and history to help the facility improve how they care for everyone.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </main>

            {/* --- FOOTER --- */}
            <footer className="relative w-full px-10 py-6 flex justify-between items-center z-50">
                <span className="text-[10px] font-black text-white/30 uppercase tracking-[0.4em]">&copy; 2026 AGAPAI SYSTEMS</span>
                <div className="flex gap-6 text-[10px] font-black text-white/30 uppercase tracking-[0.4em]">
                    <span>PUP Engineering</span>
                    <span className="text-teal-400/50">Thesis Project</span>
                </div>
            </footer>

            {/* --- CONTACT PANEL --- */}
            <div className={`fixed inset-0 z-[100] transition-all duration-500 ${isContactPanelOpen ? 'opacity-100 visible' : 'opacity-0 invisible'}`}>
                <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={toggleContactPanel}></div>
                <div className={`absolute top-0 right-0 h-full w-full max-w-[340px] bg-slate-900/95 backdrop-blur-3xl border-l border-white/5 p-12 flex flex-col transform transition-transform duration-500 ease-in-out ${isContactPanelOpen ? 'translate-x-0' : 'translate-x-full'}`}>
                    <div className="flex justify-between items-center mb-16">
                        <h3 className="text-2xl font-black text-white tracking-tighter uppercase">Connect<span className="text-teal-400">.</span></h3>
                        <button onClick={toggleContactPanel} className="w-10 h-10 flex items-center justify-center rounded-full bg-white/5 text-white/40 hover:text-white transition-all"><FaTimes /></button>
                    </div>
                    <div className="space-y-12">
                        <div>
                            <label className="text-[10px] font-black text-teal-400 uppercase tracking-widest mb-3 block">Email Inquiry</label>
                            <a href="mailto:w4makeithappen@gmail.com" className="text-base font-bold text-white hover:text-teal-400 transition-colors break-words">w4makeithappen@gmail.com</a>
                        </div>
                        <div>
                            <label className="text-[10px] font-black text-teal-400 uppercase tracking-widest mb-3 block">Emergency Line</label>
                            <a href="tel:+639506343472" className="text-base font-bold text-white hover:text-teal-400 transition-colors">+63 950 634 3472</a>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}