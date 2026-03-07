import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { FaUserCircle, FaSignOutAlt, FaTimes, FaCog, FaFile, FaBars, FaTh, FaQuestionCircle } from 'react-icons/fa';
import agapaiLogo from '../../assets/logo/agapai-logo.png';

export default function Header({ user, logout }) {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [hidden, setHidden] = useState(false);
    const [scrolled, setScrolled] = useState(false); // New state for scroll background
    const [lastScrollY, setLastScrollY] = useState(0);
    const location = useLocation();
    const [showLogoutModal, setShowLogoutModal] = useState(false);

    const shouldRenderHeader = location.pathname !== '/' && location.pathname !== '/landing';

    const navItems = [
        { name: 'Dashboard', path: '/dashboard', icon: FaTh },
        { name: 'Reports', path: '/reports', icon: FaFile },
        { name: 'Settings', path: '/settings', icon: FaCog },
    ];

    const toggleMenu = () => setIsMenuOpen(!isMenuOpen);
    const isActive = (path) => location.pathname === path;

    useEffect(() => {
        const handleScroll = () => {
            const currentScrollY = window.scrollY;
            
            // Show/Hide logic
            if (currentScrollY > lastScrollY && currentScrollY > 100) {
                setHidden(true);
            } else {
                setHidden(false);
            }

            // Glassmorphism trigger
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
        <header
            className={`sticky top-0 z-50 transition-all duration-500 ${
                hidden ? '-translate-y-full' : 'translate-y-0'
            } ${
                scrolled 
                ? 'bg-[#015954]/90 backdrop-blur-md border-b border-teal-700/50 py-2 shadow-xl' 
                : 'bg-gradient-to-r from-[#2d3092] to-[#015954] py-4'
            }`}
        >
            <div className="container mx-auto px-6 flex justify-between items-center transition-all">
                {/* Logo and Brand */}
                <Link to="/dashboard" className="flex items-center group">
                    <div className="relative">
                        <img
                            src={agapaiLogo}
                            alt="AGAPAI Logo"
                            className="h-10 w-10 sm:h-12 sm:w-12 rounded-xl shadow-lg transition-transform group-hover:scale-110"
                            onError={(e) => {
                                e.target.src = 'https://placehold.co/100?text=A';
                            }}
                        />
                        <div className="absolute inset-0 rounded-xl bg-teal-400 opacity-0 group-hover:opacity-20 transition-opacity"></div>
                    </div>
                    
                    <div className="ml-4 flex flex-col justify-center">
                        <h1 className="text-2xl font-black tracking-tighter text-white leading-none">
                            AGAPAI<span className="text-teal-400">.</span>
                        </h1>
                        <p className="hidden lg:block text-[10px] uppercase font-bold tracking-[0.2em] text-teal-100/70 mt-1">
                            Vision-Based Monitoring
                        </p>
                    </div>
                </Link>

                {/* Desktop Nav */}
                <nav className="hidden md:flex items-center bg-black/10 rounded-2xl p-1 border border-white/5">
                    {navItems.map((item) => (
                        <Link
                            key={item.name}
                            to={item.path}
                            className={`flex items-center px-5 py-2 text-xs font-bold uppercase tracking-widest rounded-xl transition-all ${
                                isActive(item.path) 
                                ? 'bg-white text-teal-900 shadow-lg' 
                                : 'text-white hover:text-teal-200'
                            }`}
                        >
                            <item.icon className={`mr-2 ${isActive(item.path) ? 'text-teal-600' : ''}`} />
                            {item.name}
                        </Link>
                    ))}
                </nav>

                {/* User Actions */}
                <div className="hidden md:flex items-center space-x-3">
                    <Link 
                        to="/settings" 
                        className="flex items-center space-x-3 px-4 py-2 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all group"
                    >
                        <div className="w-8 h-8 rounded-lg bg-teal-500 flex items-center justify-center text-white font-bold shadow-inner">
                            {user?.username?.charAt(0).toUpperCase() || 'U'}
                        </div>
                        <span className="text-sm font-semibold text-white">{user?.username || 'User'}</span>
                    </Link>

                    <button
                        onClick={() => setShowLogoutModal(true)}
                        className="p-3 text-white bg-red-500/20 hover:bg-red-500 border border-red-500/30 hover:border-red-500 rounded-xl transition-all shadow-lg active:scale-95"
                        title="Logout"
                    >
                        <FaSignOutAlt />
                    </button>
                </div>

                {/* Mobile Toggle */}
                <button
                    onClick={toggleMenu}
                    className="md:hidden w-10 h-10 flex items-center justify-center rounded-xl bg-white/10 text-white"
                >
                    {isMenuOpen ? <FaTimes /> : <FaBars />}
                </button>
            </div>

            {/* Mobile Nav Menu */}
            <div className={`md:hidden overflow-hidden transition-all duration-300 ${isMenuOpen ? 'max-h-96 border-t border-white/10' : 'max-h-0'}`}>
                <div className="bg-teal-900/95 backdrop-blur-xl p-6 space-y-4">
                    {navItems.map((item) => (
                        <Link
                            key={item.name}
                            to={item.path}
                            onClick={() => setIsMenuOpen(false)}
                            className={`flex items-center p-4 rounded-xl text-sm font-bold uppercase tracking-widest ${
                                isActive(item.path) ? 'bg-white text-teal-900' : 'text-white bg-white/5'
                            }`}
                        >
                            <item.icon className="mr-4 text-lg" />
                            {item.name}
                        </Link>
                    ))}
                    <div className="pt-4 border-t border-white/10 flex items-center justify-between">
                        <Link to="/settings" className="flex items-center text-white" onClick={() => setIsMenuOpen(false)}>
                            <FaUserCircle className="text-2xl mr-3 text-teal-400" />
                            <span className="font-bold">{user?.username}</span>
                        </Link>
                        <button onClick={() => setShowLogoutModal(true)} className="text-red-400 font-bold uppercase text-xs tracking-widest">
                            Logout
                        </button>
                    </div>
                </div>
            </div>

            {/* Modal Overlay */}
            {showLogoutModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-teal-950/60 backdrop-blur-sm" onClick={() => setShowLogoutModal(false)}></div>
                    <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden animate-in zoom-in duration-300">
                        <div className="p-8 text-center">
                            <div className="w-16 h-16 bg-red-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                                <FaSignOutAlt className="text-2xl text-red-500" />
                            </div>
                            <h4 className="text-2xl font-bold text-gray-900 mb-2">Confirm Logout</h4>
                            <p className="text-gray-500 text-sm leading-relaxed mb-8">
                                Are you sure you want to end your current session?
                            </p>
                            <div className="grid grid-cols-2 gap-3">
                                <button
                                    onClick={() => setShowLogoutModal(false)}
                                    className="px-6 py-3 text-sm font-bold text-gray-400 bg-gray-50 rounded-2xl hover:bg-gray-100 transition-all"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleConfirmLogout}
                                    className="px-6 py-3 text-sm font-bold text-white bg-red-500 rounded-2xl hover:bg-red-600 shadow-lg shadow-red-200 transition-all"
                                >
                                    Logout
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </header>
    );
}