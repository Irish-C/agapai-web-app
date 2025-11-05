import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter as Router } from 'react-router-dom';
import App from './App.jsx';
// Corrected absolute path for global CSS
import './assets/styles/index.css'; 

/**
 * The main entry point for the React application.
 */
ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <Router>
      {/* App.jsx handles authentication, state, and page routing */}
      <App />
    </Router>
  </React.StrictMode>
);