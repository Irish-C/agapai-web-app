import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
    import { FaUserCircle, FaSignOutAlt, FaTimes, FaCog , FaFile, FaBars, FaTh} from 'react-icons/fa';
import agapaiLogo from '../../assets/images/logos/agapai-logo.png';

export default function Header({ user, logout }) {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [hidden, setHidden] = useState(false); // track header visibility
    const [lastScrollY, setLastScrollY] = useState(0);
    const location = useLocation();
    
    // Hide header on landing/root page
    if (location.pathname === '/' || location.pathname === '/landing') {
        return null;
    }

    const navItems = [
        { name: 'Dashboard', path: '/dashboard', icon: FaTh },
        { name: 'Reports', path: '/reports', icon: FaFile },
        { name: 'Settings', path: '/settings', icon: FaCog },
    ];

    const toggleMenu = () => setIsMenuOpen(!isMenuOpen);
    const isActive = (path) => location.pathname === path;

    // Scroll effect to hide/show header
    useEffect(() => {
        const handleScroll = () => {
            const currentScrollY = window.scrollY;
            if (currentScrollY > lastScrollY && currentScrollY > 50) {
                // scrolling down
                setHidden(true);
            } else {
                // scrolling up
                setHidden(false);
            }
            setLastScrollY(currentScrollY);
        };

        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, [lastScrollY]);

    return (
        <header
        className={`bg-gradient-to-b from-[#2d3092] to-[#015954] text-white shadow-lg sticky top-0 z-20 transition-transform duration-300 ${
            hidden ? '-translate-y-full' : 'translate-y-0'
        }`}
        >
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 flex justify-between items-center h-16">
            {/* Logo and App Title */}
            <Link
            to="/dashboard"
            className="flex items-center space-x-3 transition duration-300 hover:opacity-90"
            >
            <img
                src={agapaiLogo}
                alt="AGAPAI Logo"
                className="h-12 w-auto rounded-full"
                onError={(e) => {
                e.target.onerror = null;
                e.target.src = 'https://placehold.co/32x32/14b8a6/ffffff?text=A';
                }}
            />
            <div className="flex flex-col leading-tight">
                <span className="text-4xl font-bold text-[#c4fcff] tracking-wider">
                AGAPAI
                </span>
                <span className="text-[0.75rem] italic text-gray-300 tracking-wide">
                A Vision-Based Monitoring and Alert System for Fall and Inactivity in
                Elderly Care Facility
                </span>
            </div>
            </Link>


                {/* Desktop Navigation Links */}
                <nav className="hidden md:flex space-x-6">
                    {navItems.map((item) => (
                        <Link
                            key={item.name}
                            to={item.path}
                            className={`flex items-center text-sm font-medium transition duration-150 ${
                                isActive(item.path) ? 'text-teal-400 border-b-2 border-teal-400' : 'hover:text-teal-400'
                            }`}
                        >
                            <item.icon className="mr-1" />
                            {item.name}
                        </Link>
                    ))}
                </nav>

                {/* User Info (Profile Link) and Logout */}
                <div className="hidden md:flex items-center space-x-4">
                    {/* MODIFIED: Link now points to /settings */}
                    <Link 
                        to="/settings" 
                        className="flex items-center space-x-2 bg-gray-700 p-2 rounded-full transition duration-150 hover:bg-gray-600 cursor-pointer"
                    >
                        {/* Changed icon color to teal-400 for visual consistency */}
                        <FaUserCircle className="w-5 h-5 text-teal-400" />
                        <span className="text-sm font-medium">{user?.username || 'User'}</span>
                    </Link>
                    <button
                        onClick={logout}
                        className="flex items-center px-3 py-1 text-sm font-medium bg-red-600 rounded-full hover:bg-red-700 transition duration-150 shadow-md"
                    >
                        <FaSignOutAlt className="mr-1" />
                        Logout
                    </button>
                </div>

                {/* Mobile Menu Button */}
                <button
                    onClick={toggleMenu}
                    className="md:hidden p-2 rounded-lg hover:bg-gray-700 transition duration-150"
                >
                    {isMenuOpen ? <FaTimes className="w-6 h-6" /> : <FaBars className="w-6 h-6" />}
                </button>
            </div>

            {/* Mobile Menu Dropdown */}
            {isMenuOpen && (
                <div className="md:hidden bg-gray-900 p-4 border-t border-gray-700">
                    <nav className="flex flex-col space-y-2 mb-4">
                        {navItems.map((item) => (
                            <Link
                                key={item.name}
                                to={item.path}
                                onClick={() => setIsMenuOpen(false)}
                                className={`flex items-center px-3 py-2 text-base font-medium rounded-lg transition duration-150 ${
                                    isActive(item.path)
                                        ? 'bg-gray-700 text-teal-400'
                                        : 'text-gray-200 hover:bg-gray-700 hover:text-teal-400'
                                }`}
                            >
                                <item.icon className="mr-3 w-5 h-5" />
                                {item.name}
                            </Link>
                        ))}
                    </nav>
                    <div className="pt-4 border-t border-gray-700 flex flex-col space-y-2">
                        {/* Static user display */}
                        <div className="flex items-center space-x-3 px-3 py-2 text-base">
                            <FaUserCircle className="w-6 h-6 text-teal-400" />
                            <span className="font-semibold">{user?.username || 'User'}</span>
                        </div>
                        
                        {/* MODIFIED: Profile link for mobile now points to /settings */}
                        <Link
                            to="/settings"
                            onClick={() => setIsMenuOpen(false)}
                            className="flex items-center justify-center w-full px-3 py-2 text-base font-medium bg-gray-700 rounded-lg hover:bg-gray-600 transition duration-150 shadow-md text-teal-400"
                        >
                            <FaUserCircle className="mr-2" />
                            View Profile
                        </Link>

                        <button
                            onClick={() => { logout(); setIsMenuOpen(false); }}
                            className="flex items-center justify-center w-full px-3 py-2 text-base font-medium bg-red-600 rounded-lg hover:bg-red-700 transition duration-150 shadow-md"
                        >
                            <FaSignOutAlt className="mr-2" />
                            Logout
                        </button>
                    </div>
                </div>
            )}
        </header>
    );
}