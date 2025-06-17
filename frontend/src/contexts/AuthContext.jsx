// frontend/src/contexts/AuthContext.jsx

import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiService } from '../services/apiService';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(() => localStorage.getItem('accessToken'));
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  const [workspaces, setWorkspaces] = useState([]);
  const [activeWorkspace, setActiveWorkspace] = useState(null);

  const logout = useCallback(() => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('activeWorkspaceId');
    setToken(null);
    setUser(null);
    setWorkspaces([]);
    setActiveWorkspace(null);
    apiService.clearToken();
    navigate('/login');
  }, [navigate]);
  
  const fetchWorkspaces = useCallback(async () => {
    if (!token) return;
    try {
      const data = await apiService.get('/workspaces/'); // Добавлен слэш в конце
      setWorkspaces(data);
      if (data.length > 0) {
        const savedId = localStorage.getItem('activeWorkspaceId');
        const active = data.find(w => w.id === parseInt(savedId, 10)) || data[0];
        setActiveWorkspace(active);
        if (!savedId || !data.some(w => w.id === parseInt(savedId, 10))) {
          localStorage.setItem('activeWorkspaceId', active.id);
        }
      }
    } catch (error) {
      console.error("Не удалось загрузить рабочие пространства", error);
    }
  }, [token]);

  const initializeUser = useCallback(async () => {
    if (token) {
      apiService.setToken(token);
      try {
        const userData = await apiService.get('/users/me/'); // Добавлен слэш в конце
        setUser(userData);
        await fetchWorkspaces();
      } catch (error) {
        console.error("Не удалось инициализировать пользователя, выход.", error);
        logout();
      }
    }
    setIsLoading(false);
  }, [token, logout, fetchWorkspaces]);

  useEffect(() => {
    initializeUser();
  }, [initializeUser]);

  const login = async (username, password) => {
    setIsLoading(true);
    try {
      // ИЗМЕНЕНИЕ ЗДЕСЬ: Используем специальный метод apiService.login
      const data = await apiService.login({ username, password });
      
      const { access_token } = data;
      localStorage.setItem('accessToken', access_token);
      setToken(access_token);
      // После установки токена, initializeUser сам подтянет все данные
      await initializeUser(); 
      navigate('/dashboard');
    } catch (error) {
      setIsLoading(false);
      // Пробрасываем ошибку выше, чтобы компонент LoginPage мог ее поймать
      throw error;
    }
  };
  
  const changeWorkspace = (workspace) => {
    setActiveWorkspace(workspace);
    localStorage.setItem('activeWorkspaceId', workspace.id);
  }

  const value = {
    token, user, isAuthenticated: !!token, isLoading, login, logout,
    workspaces, activeWorkspace, changeWorkspace, fetchWorkspaces
  };

  return <AuthContext.Provider value={value}>{!isLoading && children}</AuthContext.Provider>;
};

export const useAuth = () => {
  return useContext(AuthContext);
};