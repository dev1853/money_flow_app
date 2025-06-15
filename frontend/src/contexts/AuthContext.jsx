// frontend/src/contexts/AuthContext.jsx
import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiService, ApiError } from '../services/apiService';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(localStorage.getItem('accessToken'));
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  const fetchCurrentUser = useCallback(async (currentToken) => {
    if (!currentToken) {
      setUser(null);
      setIsLoading(false);
      return;
    }
    
    try {
      // ================== ИЗМЕНЕНИЕ ЗДЕСЬ ==================
      // Убран /api из начала
      const userData = await apiService.get('/users/me/'); 
      // ======================================================
      setUser(userData);
    } catch (error) {
      console.error("Ошибка при получении данных пользователя:", error);
      // Очищаем токен, если он недействителен
      localStorage.removeItem('accessToken');
      localStorage.removeItem('tokenType');
      setToken(null);
      setUser(null);
      if (error instanceof ApiError && error.status === 401) {
        if (window.location.pathname !== '/login' && window.location.pathname !== '/register') {
          navigate('/login');
        }
      }
    } finally {
        setIsLoading(false);
    }
  }, [navigate]);

  useEffect(() => {
    const currentToken = localStorage.getItem('accessToken');
    if (currentToken) {
        apiService.setToken(currentToken);
        fetchCurrentUser(currentToken);
    } else {
        setIsLoading(false);
    }
  }, [fetchCurrentUser]);

  const login = async (email, password) => {
    setIsLoading(true);
    try {
      // ================== ИЗМЕНЕНИЕ ЗДЕСЬ ==================
      // Убран /api из начала
      const data = await apiService.post('/auth/login', new URLSearchParams({
          username: email,
          password: password,
      }), {
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      });
      // ======================================================

      const { access_token, token_type } = data;
      localStorage.setItem('accessToken', access_token);
      localStorage.setItem('tokenType', token_type);
      setToken(access_token);
      apiService.setToken(access_token);
      await fetchCurrentUser(access_token);
      navigate('/dashboard');

    } catch (error) {
      console.error('Login error:', error);
      localStorage.removeItem('accessToken');
      localStorage.removeItem('tokenType');
      setToken(null);
      setUser(null);
      setIsLoading(false);
      throw error instanceof ApiError ? new Error(error.message || 'Не удалось войти.') : error;
    } 
  };

  const logout = useCallback(() => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('tokenType');
    setToken(null);
    setUser(null);
    apiService.clearToken(); // <-- ДОБАВЬТЕ ЭТУ СТРОКУ
    navigate('/login');
  }, [navigate]);

  const value = {
    token,
    user,
    isAuthenticated: !!token,
    isLoading,
    login,
    logout,
    fetchCurrentUser
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === null) {
    throw new Error('useAuth должен использоваться внутри AuthProvider');
  }
  return context;
};