import React from 'react';
import { FaHeart } from 'react-icons/fa';

export default function Footer() {
    return (
        <footer className="bg-gray-800 text-gray-400 text-sm mt-auto">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-4 flex flex-col md:flex-row justify-between items-center">
                <p className="text-center md:text-left mb-2 md:mb-0">
                    &copy; {new Date().getFullYear()} AGAPAI Monitoring System. All rights reserved.
                </p>
                <p className="flex items-center space-x-1 text-center md:text-right">
                    <span>Designed and Developed with </span>
                    <FaHeart className="text-red-500 animate-pulse" />
                    <span> for Elder Care.</span>
                </p>
            </div>
        </footer>
    );
}