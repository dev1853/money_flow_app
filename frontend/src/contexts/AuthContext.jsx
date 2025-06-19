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
  
  const [accounts, setAccounts] = useState([]);

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
  
  const fetchAccounts = useCallback(async () => {
    if (!token || !activeWorkspace) return; // Не грузим, если нет токена или рабочего пространства
    try {
      // Убедитесь, что ваш API-эндпоинт правильный
    const data = await apiService.get(`/accounts/?workspace_id=${activeWorkspace.id}`);
      // Гарантируем, что в состояние всегда попадет массив
      // ДЛЯ ОТЛАДКИ
    console.log("Получены данные счетов с сервера:", data);
      setAccounts(data || []);
    } catch (error) {
      console.error("Не удалось загрузить счета:", error);
      setAccounts([]); // В случае ошибки устанавливаем пустой массив
    }
  }, [token, activeWorkspace]);

  const fetchWorkspaces = useCallback(async () => {
    if (!token) return;
    try {
      const data = await apiService.get('/workspaces');
      setWorkspaces(data);
      if (data.length > 0) {
        const savedId = localStorage.getItem('activeWorkspaceId');
        const active = data.find(w => w.id === parseInt(savedId, 10)) || data[0];
        setActiveWorkspace(active);
        if (!savedId || !data.some(w => w.id === parseInt(savedId, 10))) {
          localStorage.setItem('activeWorkspaceId', active.id);
        }
      } else {
        setActiveWorkspace(null);
      }
    } catch (error) {
      console.error("Ошибка при загрузке рабочих пространств:", error);
    }
  }, [token]);

  const initializeUser = useCallback(async () => {
    if (token) {
      apiService.setToken(token);
      try {
        const userData = await apiService.get('/users/me');
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
      const data = await apiService.login({ username, password });
      
      const { access_token } = data;
      localStorage.setItem('accessToken', access_token);
      setToken(access_token);
      
      await initializeUser(); 
      navigate('/dashboard');

    } catch (error) {
      setIsLoading(false);
      throw error;
    }
  };
  
  const changeWorkspace = (workspace) => {
    setActiveWorkspace(workspace);
    localStorage.setItem('activeWorkspaceId', workspace.id);
  }

  useEffect(() => {
    console.log("useEffect для загрузки счетов сработал. activeWorkspace:", activeWorkspace);
    if (activeWorkspace) {
      console.log("activeWorkspace определен, вызываем fetchAccounts...");
      fetchAccounts();
    } else {
      console.log("activeWorkspace не определен, счета не загружаем.");
    }
  }, [activeWorkspace, fetchAccounts]);

  const value = {
    token,
    user,
    isAuthenticated: !!token,
    isLoading,
    login,
    logout,
    workspaces,
    activeWorkspace,
    changeWorkspace,
    fetchWorkspaces,
    accounts,
    fetchAccounts
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => useContext(AuthContext);