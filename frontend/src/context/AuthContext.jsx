import React, { createContext, useContext, useState, useEffect } from 'react';
import apiClient from '../api/client';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('bhumisetu_user');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        return null;
      }
    }
    return null;
  });

  const [accessToken, setAccessToken] = useState(() => localStorage.getItem('bhumisetu_access_token') || null);
  const [loading, setLoading] = useState(false);
  const [authError, setAuthError] = useState(null);

  useEffect(() => {
    if (user) {
      localStorage.setItem('bhumisetu_user', JSON.stringify(user));
    } else {
      localStorage.removeItem('bhumisetu_user');
    }
  }, [user]);

  // Listen for 401 unhandled logout event
  useEffect(() => {
    const handleUnauthorized = () => {
      logout();
    };
    window.addEventListener('bhumisetu:unauthorized', handleUnauthorized);
    return () => window.removeEventListener('bhumisetu:unauthorized', handleUnauthorized);
  }, []);

  /**
   * Real Citizen Self-Registration
   */
  const register = async ({ name, email, password }) => {
    setLoading(true);
    setAuthError(null);
    try {
      const res = await apiClient.post('/auth/register', {
        name,
        email,
        password,
      });

      setLoading(false);
      if (res.data?.success) {
        return { success: true, user: res.data.user };
      }
      return { success: false, error: res.data?.error || 'Registration failed' };
    } catch (err) {
      const msg = err.response?.data?.error || err.response?.data?.message || err.message || 'Registration failed';
      setAuthError(msg);
      setLoading(false);
      return { success: false, error: msg };
    }
  };

  /**
   * Real Authentication against backend /api/v1/auth/login
   * Role and permissions are derived strictly from authenticated database session/token.
   */
  const login = async (email, password) => {
    setLoading(true);
    setAuthError(null);

    try {
      const res = await apiClient.post('/auth/login', {
        email: email.trim(),
        password,
      });

      if (res.data?.success && res.data.accessToken) {
        const token = res.data.accessToken;
        setAccessToken(token);
        localStorage.setItem('bhumisetu_access_token', token);
        if (res.data.refreshToken) {
          localStorage.setItem('bhumisetu_refresh_token', res.data.refreshToken);
        }

        const authenticatedUser = res.data.user;
        setUser(authenticatedUser);
        setLoading(false);
        return { success: true, user: authenticatedUser };
      }

      throw new Error(res.data?.error || 'Invalid authentication response');
    } catch (err) {
      const msg = err.response?.data?.error || err.response?.data?.message || err.message || 'Invalid email or password';
      setAuthError(msg);
      setLoading(false);
      return { success: false, error: msg };
    }
  };

  const logout = async () => {
    try {
      await apiClient.post('/auth/logout');
    } catch (e) {
      // ignore
    }
    setUser(null);
    setAccessToken(null);
    localStorage.removeItem('bhumisetu_access_token');
    localStorage.removeItem('bhumisetu_refresh_token');
    localStorage.removeItem('bhumisetu_user');
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        accessToken,
        loading,
        authError,
        login,
        register,
        logout,
        isAuthenticated: Boolean(user && accessToken),
        role: user?.role || null,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);

export default AuthContext;
