import React from 'react';
import Header from '../components/common/Header.jsx'; // Updated import path
import Footer from '../components/common/Footer.jsx'; // Updated import path
import CameraGrid from '../components/CameraGrid.jsx';

/**
 * Main dashboard view displaying video feeds and incident reports.
 * @param {object} props - Props containing user data and logout function.
 */
export default function MainPage({ user, logout }) {
  return (
    <div className="flex flex-col min-h-screen bg-gray-100">
      <Header user={user} logout={logout} />
      
      <main className="flex-grow container mx-auto">
        <h1 className="text-3xl font-extrabold text-gray-900 pt-8 px-6">
          Welcome, <span className="text-teal-600">{user.username}</span>!
        </h1>
        <p className="text-gray-500 mb-6 px-6">Your real-time monitoring dashboard is live.</p>

        <CameraGrid />
      </main>

      <Footer />
    </div>
  );
}
