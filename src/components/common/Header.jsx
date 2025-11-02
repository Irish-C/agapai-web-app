import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { FaUserCircle, FaSignOutAlt, FaTachometerAlt, FaChartBar, FaCog, FaBars, FaTimes } from 'react-icons/fa';

const logoPath = '/assets/images/logos/agapai-logo.png'; 

export default function Header({ user, logout }) {
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    const navItems = [
        { name: 'Dashboard', path: '/dashboard', icon: FaTachometerAlt },
        { name: 'Reports', path: '/reports', icon: FaChartBar },
        { name: 'Settings', path: '/settings', icon: FaCog },
    ];

    const toggleMenu = () => setIsMenuOpen(!isMenuOpen);

    return (
        <header className="bg-gray-800 text-white shadow-lg sticky top-0 z-20">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8 flex justify-between items-center h-16">
                
                {/* Logo and App Title */}
                <Link to="/dashboard" className="flex items-center space-x-3 transition duration-300 hover:opacity-90">
                    <img src={logoPath} alt="AGAPAI Logo" className="h-8 w-auto rounded-full" 
                         onError={(e) => { e.target.onerror = null; e.target.src="https://placehold.co/32x32/14b8a6/ffffff?text=A" }}/>
                    <span className="text-xl font-bold tracking-wider">AGAPAI</span>
                </Link>

                {/* Desktop Navigation Links */}
                <nav className="hidden md:flex space-x-6">
                    {navItems.map((item) => (
                        <Link 
                            key={item.name} 
                            to={item.path} 
                            className="flex items-center text-sm font-medium hover:text-teal-400 transition duration-150"
                        >
                            <item.icon className="mr-1" />
                            {item.name}
                        </Link>
                    ))}
                </nav>

                {/* User Info and Logout */}
                <div className="hidden md:flex items-center space-x-4">
                    <div className="flex items-center space-x-2 bg-gray-700 p-2 rounded-full">
                        <FaUserCircle className="w-5 h-5 text-teal-400" />
                        <span className="text-sm font-medium">{user.username}</span>
                    </div>
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
                                className="flex items-center px-3 py-2 text-base font-medium text-gray-200 rounded-lg hover:bg-gray-700 hover:text-teal-400 transition duration-150"
                            >
                                <item.icon className="mr-3 w-5 h-5" />
                                {item.name}
                            </Link>
                        ))}
                    </nav>
                    <div className="pt-4 border-t border-gray-700 flex flex-col space-y-2">
                        <div className="flex items-center space-x-3 px-3 py-2 text-base">
                            <FaUserCircle className="w-6 h-6 text-teal-400" />
                            <span className="font-semibold">{user.username}</span>
                        </div>
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