import React from 'react';
import CameraGrid from '../components/CameraGrid.jsx';

/**
 * Main dashboard view displaying video feeds and incident reports.
 * @param {object} props - Props containing user data.
 */
export default function MainPage({ user }) {
  // App.jsx handles the Header, Footer, and the gray "flex-grow" background.
  return (
    <div className="container mx-auto">
      <CameraGrid />
    </div>
  );
}