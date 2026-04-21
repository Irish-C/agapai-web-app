// src/main.jsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter as Router } from 'react-router-dom';
import App from './App.jsx';
import GlobalErrorBoundary from './src/components/GlobalErrorBoundary';
import { AuthProvider } from './src/components/AuthContext.jsx';
import { PersistentVideoProvider } from './src/components/PersistentVideoContext.jsx';

// Absolute path for global CSS
import "./src/index.css";

/**
 * The main entry point for the React application.
 */
ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <GlobalErrorBoundary>
      <AuthProvider>
        <PersistentVideoProvider>
          <Router>
            <App />
          </Router>
        </PersistentVideoProvider>
      </AuthProvider>
    </GlobalErrorBoundary>
  </React.StrictMode>
);