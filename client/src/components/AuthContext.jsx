import React, { createContext, useState, useEffect } from 'react';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [features, setFeatures] = useState({});
  const [isAuthReady, setIsAuthReady] = useState(false);

  useEffect(() => {
    // Restore from localStorage
    const storedUser = localStorage.getItem('user');
    const storedToken = localStorage.getItem('authToken');  // Use same key as apiService
    const storedFeatures = localStorage.getItem('userFeatures');
    console.log('[AuthContext] Initializing from localStorage:', {
      hasUser: !!storedUser,
      hasToken: !!storedToken,
      hasFeatures: !!storedFeatures,
      featureCount: storedFeatures ? Object.keys(JSON.parse(storedFeatures)).length : 0
    });
    if (storedUser && storedToken) {
      setUser(JSON.parse(storedUser));
      setToken(storedToken);
      if (storedFeatures) {
        const parsedFeatures = JSON.parse(storedFeatures);
        setFeatures(parsedFeatures);
        console.log('[AuthContext] Restored features from localStorage:', Object.keys(parsedFeatures).length, 'features');
      }
    }
    // Mark auth as ready whether or not user was found
    setIsAuthReady(true);
  }, []);

  const login = async (username, password) => {
    try {
      console.log('[AuthContext] Login attempt for:', username);
      // Call API
      const response = await import('../services/apiService.js').then(mod => mod.loginUser(username, password));
      if (response && (response.access_token || response.token)) {
        const token = response.access_token || response.token;
        const userData = {
          username: response.username,
          token: token,
          userId: response.user_id,
          role: response.role
        };
        console.log('[AuthContext] Login successful for', username, 'with role:', response.role);
        setUser(userData);
        setToken(token);
        localStorage.setItem('user', JSON.stringify(userData));
        localStorage.setItem('authToken', token);  // Use same key as apiService
        
        // Fetch user features from the feature endpoint
        try {
          console.log('[AuthContext] Fetching user features...');
          const { API_URL } = await import('../services/apiService.js');
          const apiUrl = API_URL || 'http://127.0.0.1:5000/api';
          console.log('[AuthContext] Using API URL:', apiUrl);
          const featuresResponse = await fetch(`${apiUrl}/admin/features/me`, {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json',
            }
          });
          
          if (featuresResponse.ok) {
            const userFeatures = await featuresResponse.json();
            const featureCount = Object.keys(userFeatures).length;
            const visibleCount = Object.values(userFeatures).filter(v => v === true).length;
            console.log('[AuthContext] Successfully fetched user features:');
            console.log('  - Total features in response:', featureCount);
            console.log('  - Visible features:', visibleCount);
            console.log('  - Visible feature keys:', Object.entries(userFeatures).filter(([, v]) => v === true).map(([k]) => k).join(', '));
            console.log('  - Full features object:', userFeatures);
            setFeatures(userFeatures);
            localStorage.setItem('userFeatures', JSON.stringify(userFeatures));
          } else {
            // If features endpoint fails, use empty features (don't fail login)
            const errorText = await featuresResponse.text().catch(() => 'Unknown error');
            console.warn('[AuthContext] Failed to fetch user features:', featuresResponse.status, featuresResponse.statusText, errorText);
            setFeatures({});
            localStorage.setItem('userFeatures', JSON.stringify({}));
          }
        } catch (featureError) {
          console.warn('[AuthContext] Error fetching user features:', featureError);
          setFeatures({});
          localStorage.setItem('userFeatures', JSON.stringify({}));
        }
        
        return { success: true, message: 'Login successful' };
      } else {
        console.warn('[AuthContext] Login failed: invalid credentials');
        return { success: false, message: 'Login failed. Invalid credentials.' };
      }
    } catch (error) {
      console.error('[AuthContext] Login error:', error);
      return { success: false, message: error.message || 'Server error.' };
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    setFeatures({});
    localStorage.removeItem('user');
    localStorage.removeItem('authToken');  // Use same key as apiService
    localStorage.removeItem('userFeatures');
    // Socket remains connected for alert delivery (independent of auth state)
  };

  return (
    <AuthContext.Provider value={{ user, token, features, login, logout, isAuthReady }}>
      {children}
    </AuthContext.Provider>
  );
};
