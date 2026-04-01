import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';

const AuthContext = createContext();

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [admin, setAdmin] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('dxt_admin_token');
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      fetchAdmin();
    } else {
      setLoading(false);
    }
  }, []);

  const fetchAdmin = async () => {
    try {
      const response = await axios.get(`${API_URL}/admin/me`);
      setAdmin(response.data.admin);
    } catch (error) {
      localStorage.removeItem('dxt_admin_token');
      delete axios.defaults.headers.common['Authorization'];
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    try {
      const response = await axios.post(`${API_URL}/admin/login`, {
        email,
        password,
      });
      
      const { token, admin } = response.data;
      localStorage.setItem('dxt_admin_token', token);
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      setAdmin(admin);
      toast.success('Login successful!');
      return true;
    } catch (error) {
      toast.error(error.response?.data?.message || 'Login failed');
      return false;
    }
  };

  const logout = () => {
    localStorage.removeItem('dxt_admin_token');
    delete axios.defaults.headers.common['Authorization'];
    setAdmin(null);
    toast.success('Logged out successfully');
  };

  const value = {
    admin,
    login,
    logout,
    loading,
    isAuthenticated: !!admin,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
