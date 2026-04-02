import React, { createContext, useState, useEffect } from 'react';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [isAuthReady, setIsAuthReady] = useState(false);

  useEffect(() => {
    // Restore from localStorage
    const storedUser = localStorage.getItem('user');
    const storedToken = localStorage.getItem('authToken');  // Use same key as apiService
    if (storedUser && storedToken) {
      setUser(JSON.parse(storedUser));
      setToken(storedToken);
    }
    // Mark auth as ready whether or not user was found
    setIsAuthReady(true);
  }, []);

  const login = async (username, password) => {
    try {
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
        setUser(userData);
        setToken(token);
        localStorage.setItem('user', JSON.stringify(userData));
        localStorage.setItem('authToken', token);  // Use same key as apiService
        return { success: true, message: 'Login successful' };
      } else {
        return { success: false, message: 'Login failed. Invalid credentials.' };
      }
    } catch (error) {
      return { success: false, message: error.message || 'Server error.' };
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('user');
    localStorage.removeItem('authToken');  // Use same key as apiService
    // Socket remains connected for alert delivery (independent of auth state)
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout, isAuthReady }}>
      {children}
    </AuthContext.Provider>
  );
};
