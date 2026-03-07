import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { FaUserCircle, FaSignOutAlt, FaTimes, FaCog, FaFile, FaBars, FaTh } from 'react-icons/fa';
import agapaiLogo from '../../assets/logo/agapai-logo.png';

export default function Header({ user, logout }) {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [hidden, setHidden] = useState(false);
    const [scrolled, setScrolled] = useState(false);
    const [lastScrollY, setLastScrollY] = useState(0);
    const location = useLocation();
    const [showLogoutModal, setShowLogoutModal] = useState(false);

    const shouldRenderHeader = location.pathname !== '/' && location.pathname !== '/landing';

    const navItems = [
        { name: 'Dashboard', path: '/dashboard', icon: FaTh },
        { name: 'Reports', path: '/reports', icon: FaFile },
        { name: 'Settings', path: '/settings', icon: FaCog },
    ];

    useEffect(() => {
        const handleScroll = () => {
            const currentScrollY = window.scrollY;
            if (currentScrollY > lastScrollY && currentScrollY > 100) setHidden(true);
            else setHidden(false);
            setScrolled(currentScrollY > 20);
            setLastScrollY(currentScrollY);
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, [lastScrollY]);

    if (!shouldRenderHeader) return null;

    const handleConfirmLogout = () => {
        setShowLogoutModal(false);
        logout();
        setIsMenuOpen(false);
    };

    return (
        <>
            <header
                className={`sticky top-0 z-40 transition-all duration-500 ${
                    hidden ? '-translate-y-full' : 'translate-y-0'
                } ${
                    scrolled 
                    ? 'bg-[#015954]/95 backdrop-blur-md border-b border-teal-700/50 py-2 shadow-xl' 
                    : 'bg-gradient-to-r from-[#2d3092] to-[#015954] py-4 shadow-lg'
                }`}
            >
                <div className="container mx-auto px-6 flex justify-between items-center">
                    {/* Logo */}
                    <Link to="/dashboard" className="flex items-center group">
                        <img src={agapaiLogo} alt="Logo" className="h-10 w-10 sm:h-12 sm:w-12 rounded-xl shadow-lg" />
                        <div className="ml-4 flex flex-col justify-center">
                            <h1 className="text-2xl font-black tracking-tighter text-white">AGAPAI<span className="text-teal-400">.</span></h1>
                            <p className="hidden lg:block text-[9px] uppercase font-bold tracking-[0.25em] text-teal-100/70">Vision Monitoring</p>
                        </div>
                    </Link>

                    {/* Desktop Nav */}
                    <nav className="hidden md:flex items-center bg-black/10 rounded-2xl p-1 border border-white/5">
                        {navItems.map((item) => (
                            <Link
                                key={item.name}
                                to={item.path}
                                className={`flex items-center px-5 py-2 text-xs font-bold uppercase tracking-widest rounded-xl transition-all ${
                                    location.pathname === item.path ? 'bg-white text-teal-900 shadow-md' : 'text-white hover:text-teal-200'
                                }`}
                            >
                                <item.icon className="mr-2" /> {item.name}
                            </Link>
                        ))}
                    </nav>

                    {/* User Actions */}
                    <div className="hidden md:flex items-center space-x-3">
                        <Link to="/settings" className="flex items-center space-x-3 px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-white">
                            <div className="w-8 h-8 rounded-lg bg-teal-500 flex items-center justify-center font-bold">
                                {user?.username?.charAt(0).toUpperCase()}
                            </div>
                            <span className="text-sm font-semibold">{user?.username}</span>
                        </Link>
                        <button
                            onClick={() => setShowLogoutModal(true)}
                            className="p-3 text-white bg-red-500/20 hover:bg-red-500 border border-red-500/30 rounded-xl transition-all"
                        >
                            <FaSignOutAlt />
                        </button>
                    </div>

                    {/* Mobile Toggle */}
                    <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="md:hidden text-white"><FaBars /></button>
                </div>

                {/* Mobile Menu */}
                {isMenuOpen && (
                    <div className="md:hidden bg-teal-900 p-6 space-y-4 border-t border-white/10">
                        {navItems.map((item) => (
                            <Link key={item.name} to={item.path} className="block text-white uppercase text-xs font-bold">{item.name}</Link>
                        ))}
                        <button onClick={() => setShowLogoutModal(true)} className="text-red-400 font-bold uppercase text-xs">Logout</button>
                    </div>
                )}
            </header>

            {/* --- LOGOUT MODAL: Moved OUTSIDE the header tag to ensure absolute centering --- */}
            {showLogoutModal && (
                <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 overflow-x-hidden overflow-y-auto outline-none focus:outline-none">
                    {/* Dark Blurred Backdrop */}
                    <div 
                        className="fixed inset-0 bg-slate-900/70 backdrop-blur-md transition-opacity" 
                        onClick={() => setShowLogoutModal(false)}
                    ></div>

                    {/* Centered Modal Card */}
                    <div className="relative bg-white rounded-[2.5rem] shadow-2xl w-full max-w-sm mx-auto z-[10000] animate-in zoom-in-95 duration-300">
                        <div className="p-10 text-center">
                            <div className="w-20 h-20 bg-red-50 rounded-3xl flex items-center justify-center mx-auto mb-6">
                                <FaSignOutAlt className="text-3xl text-red-500" />
                            </div>

                            <h4 className="text-2xl font-black text-gray-900 mb-3 tracking-tight">Confirm Logout</h4>
                            <p className="text-gray-500 text-base leading-relaxed mb-8">
                                Are you sure you want to log out? You will need to sign in again to access the dashboard.
                            </p>

                            <div className="flex flex-col gap-3">
                                <button
                                    onClick={handleConfirmLogout}
                                    className="w-full py-4 text-sm font-bold text-white bg-red-600 rounded-2xl hover:bg-red-700 shadow-lg shadow-red-100 transition-all active:scale-95"
                                >
                                    Yes, Log Me Out
                                </button>
                                <button
                                    onClick={() => setShowLogoutModal(false)}
                                    className="w-full py-4 text-sm font-bold text-gray-400 bg-gray-50 rounded-2xl hover:bg-gray-100 transition-all"
                                >
                                    Stay Logged In
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}