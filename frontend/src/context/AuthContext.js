import { createContext, useContext, useState, useEffect } from 'react';
import { API } from '../App';

const AuthContext = createContext(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState(localStorage.getItem('buildforce_token'));

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      // Try to get user from /auth/me (works with both JWT and session cookie)
      const storedToken = localStorage.getItem('buildforce_token');
      
      const response = await fetch(`${API}/auth/me`, {
        credentials: 'include',
        headers: storedToken ? { 'Authorization': `Bearer ${storedToken}` } : {}
      });
      
      if (response.ok) {
        const userData = await response.json();
        setUser(userData);
      } else {
        // Clear invalid token
        localStorage.removeItem('buildforce_token');
        setToken(null);
        setUser(null);
      }
    } catch (error) {
      console.error('Auth check failed:', error);
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    const response = await fetch(`${API}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
      credentials: 'include'
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Login failed');
    }

    const data = await response.json();
    localStorage.setItem('buildforce_token', data.token);
    setToken(data.token);
    setUser(data.user);
    return data.user;
  };

  const register = async (userData) => {
    const response = await fetch(`${API}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(userData),
      credentials: 'include'
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Registration failed');
    }

    const data = await response.json();
    localStorage.setItem('buildforce_token', data.token);
    setToken(data.token);
    setUser(data.user);
    return data.user;
  };

  const processGoogleAuth = async (sessionId) => {
    const response = await fetch(`${API}/auth/session`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ session_id: sessionId }),
      credentials: 'include'
    });

    if (!response.ok) {
      throw new Error('Google authentication failed');
    }

    const userData = await response.json();
    setUser(userData);
    return userData;
  };

  const logout = async () => {
    try {
      await fetch(`${API}/auth/logout`, {
        method: 'POST',
        credentials: 'include',
        headers: token ? { 'Authorization': `Bearer ${token}` } : {}
      });
    } catch (error) {
      console.error('Logout error:', error);
    }
    
    localStorage.removeItem('buildforce_token');
    setToken(null);
    setUser(null);
  };

  const switchUserType = async () => {
    const response = await fetch(`${API}/auth/switch-user-type`, {
      method: 'PUT',
      credentials: 'include',
      headers: token ? { 'Authorization': `Bearer ${token}` } : {}
    });

    if (!response.ok) {
      throw new Error('Failed to switch user type');
    }

    const userData = await response.json();
    setUser(userData);
    return userData;
  };

  const updateUser = (userData) => {
    setUser(userData);
  };

  const getAuthHeaders = () => {
    return token ? { 'Authorization': `Bearer ${token}` } : {};
  };

  const value = {
    user,
    token,
    loading,
    isAuthenticated: !!user,
    login,
    register,
    logout,
    processGoogleAuth,
    switchUserType,
    updateUser,
    getAuthHeaders,
    checkAuth
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
