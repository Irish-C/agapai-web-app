import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { FaSignInAlt, FaVideo, FaChartLine, FaEnvelope, FaShieldAlt, FaChevronRight, FaTimes } from 'react-icons/fa'; 
import agapaiLogo from '../assets/logo/agapai-logo.png';
import filter_bg from '../assets/bg/filter-bg.png';

export default function LandingPage() {
    const [isContactPanelOpen, setIsContactPanelOpen] = useState(false);

    return (
        <div className="h-screen w-full flex flex-col bg-[#0f172a] text-slate-200 font-sans selection:bg-teal-400/30 overflow-hidden relative">
            
            {/* BACKGROUND LAYER */}
            <div 
                className="fixed inset-0 z-0 opacity-40"
                style={{
                    backgroundImage: `url(${filter_bg})`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                }}
            />
            <div className="fixed inset-0 bg-gradient-to-b from-slate-950/80 via-slate-900/50 to-slate-950 z-0"></div>

            {/* --- SLIDE OVER CONTACT PANEL --- */}
            <div 
                className={`fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-[60] transition-opacity duration-300 ${isContactPanelOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
                onClick={() => setIsContactPanelOpen(false)}
            />
            
            <aside className={`fixed top-0 right-0 h-full w-full max-w-md bg-slate-900 border-l border-white/10 z-[70] shadow-2xl transform transition-transform duration-500 ease-in-out ${isContactPanelOpen ? 'translate-x-0' : 'translate-x-full'}`}>
                <div className="p-8 flex flex-col h-full">
                    <div className="flex justify-between items-center mb-8">
                        <h2 className="text-2xl font-bold text-white">Contact Support</h2>
                        <button 
                            onClick={() => setIsContactPanelOpen(false)}
                            className="p-2 hover:bg-white/5 rounded-lg text-slate-400 hover:text-white transition-colors"
                        >
                            <FaTimes size={24} />
                        </button>
                    </div>

                    <form className="space-y-6">
                        <div>
                            <label className="block text-sm font-medium text-slate-400 mb-2">Full Name</label>
                            <input type="text" className="w-full bg-slate-800 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-teal-300/50 transition-colors" placeholder="John Doe" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-400 mb-2">Email Address</label>
                            <input type="email" className="w-full bg-slate-800 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-teal-300/50 transition-colors" placeholder="john@example.com" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-400 mb-2">Message</label>
                            <textarea rows="4" className="w-full bg-slate-800 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-teal-300/50 transition-colors" placeholder="How can we help you?"></textarea>
                        </div>
                        <button type="submit" className="w-full py-4 bg-teal-500 hover:bg-teal-300 text-slate-950 font-bold rounded-xl transition-all shadow-lg shadow-teal-500/20">
                            Send Message
                        </button>
                    </form>

                    <div className="mt-auto pt-8 border-t border-white/5">
                        <p className="text-sm text-slate-500 text-center">
                            Or email us directly at <br />
                            <span className="text-violet-400 font-medium">support@agapai.ai</span>
                        </p>
                    </div>
                </div>
            </aside>

            {/* --- NAVIGATION --- */}
            <nav className="relative z-50 w-full max-w-7xl mx-auto flex justify-between items-center px-6 py-6 shrink-0">
                <div className="flex items-center gap-3">
                    <img src={agapaiLogo} alt="Logo" className="w-9 h-9 rounded-xl shadow-lg shadow-teal-400/20" />
                    <span className="text-xl font-bold tracking-tight text-white uppercase">
                        AGAP<span className="text-teal-400">AI</span>
                    </span>
                </div>
                
                <div className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-400">
                    <a href="#features" className="hover:text-teal-300 transition-colors">Features</a>
                    <a href="#about" className="hover:text-violet-400 transition-colors">About</a>
                    <button 
                        onClick={() => setIsContactPanelOpen(true)}
                        className="px-5 py-2 rounded-full bg-white/5 border border-white/10 hover:bg-white/10 transition-all text-white"
                    >
                        Contact Support
                    </button>
                </div>
            </nav>

            {/* --- HERO SECTION --- */}
            <main className="relative z-10 flex-1 flex items-center min-h-0 overflow-hidden">
                <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-2 gap-16 w-full">
                    
                    {/* Left: Content */}
                    <div className="flex flex-col justify-center space-y-6">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-violet-500/10 border border-violet-500/20 w-fit">
                            <span className="relative flex h-2 w-2">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-violet-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-violet-500"></span>
                            </span>
                            <span className="text-[10px] font-bold uppercase tracking-widest text-violet-400">Next-Gen Elderly Care</span>
                        </div>

                        <h1 className="text-5xl md:text-6xl xl:text-7xl font-extrabold text-white leading-[1.1] tracking-tight">
                            Vision-based <br />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-300 via-teal-100 to-violet-400">
                                Monitoring
                            </span>
                        </h1>
                        
                        <div className="space-y-4">
                            <p className="text-lg md:text-xl text-slate-400 text-white leading-relaxed max-w-lg">
                                Ka-AGAPAI sa Seguridad ng ating mga <span className="text-violet-300 font-semibold italic"></span>Lolo't Lola
                            </p>
                            <p className="text-base md:text-lg text-slate-400 leading-relaxed max-w-lg">
                                An intelligent vision-based system providing everyday monitoring for falls and inactivity, ensuring our <span className="text-violet-300 font-semibold italic">loved ones</span> are never alone.
                            </p>
                        </div>

                        <div className="flex flex-col sm:flex-row gap-4 pt-2">
                            <Link 
                                to="/login" 
                                className="px-8 py-4 bg-teal-600 hover:bg-teal-300 text-white hover:text-slate-950 font-bold rounded-xl transition-all duration-300 flex items-center justify-center gap-2 shadow-lg shadow-teal-500/10 group">
                                Get Started
                                <FaChevronRight className="text-sm group-hover:translate-x-1 transition-transform" />
                            </Link>
                            <button className="px-8 py-4 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl transition-all border border-slate-700">
                                View Live Demo
                            </button>
                        </div>
                    </div>

                    {/* Right: Feature "Bento" Grid */}
                    <div className="relative hidden lg:block">
                        <div className="absolute -inset-4 bg-violet-500/10 blur-3xl rounded-full"></div>
                        <div className="relative grid gap-4">
                            <div className="p-6 bg-slate-900/50 backdrop-blur-xl border border-white/10 rounded-2xl hover:border-teal-300/50 transition-colors shadow-2xl group">
                                <div className="flex items-start gap-4">
                                    <div className="p-3 bg-teal-500/10 rounded-lg text-teal-400 group-hover:bg-teal-300 group-hover:text-slate-950 transition-all">
                                        <FaVideo size={20} />
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-bold text-white mb-1">Real-time Monitoring</h3>
                                        <p className="text-sm text-slate-400 leading-relaxed">
                                            The system watches for falls or long periods of inactivity and alerts the staff immediately.
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="p-6 bg-slate-900/50 backdrop-blur-xl border border-white/10 rounded-2xl hover:border-violet-400/50 transition-colors shadow-2xl group ml-8">
                                <div className="flex items-start gap-4">
                                    <div className="p-3 bg-violet-500/10 rounded-lg text-violet-400 group-hover:bg-violet-400 group-hover:text-white transition-all">
                                        <FaChartLine size={20} />
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-bold text-white mb-1">Efficient Reporting</h3>
                                        <p className="text-sm text-slate-400 leading-relaxed">
                                            Keep track of everything with clear logs and history to help the facility improve care.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                </div>
            </main>

            {/* --- FOOTER --- */}
            <footer className="relative z-10 border-t border-white/5 bg-slate-950/50 backdrop-blur-md shrink-0">
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