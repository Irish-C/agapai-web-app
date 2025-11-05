import React from 'react';
import CameraGrid from '../components/CameraGrid.jsx';

/**
 * Main dashboard view displaying video feeds and incident reports.
 * @param {object} props - Props containing user data.
 */
export default function MainPage({ user }) {
  // This component now just renders its content.
  // App.jsx handles the Header, Footer, and the gray "flex-grow" background.
  return (
    <div className="container mx-auto">
      <h1 className="text-3xl font-extrabold text-gray-900 pt-8 px-6">
        Welcome, <span className="text-teal-600">{user.username}</span>!
      </h1>
      <p className="text-gray-500 mb-6 px-6">Your real-time monitoring dashboard is live.</p>

      <CameraGrid />
    </div>
  );
}