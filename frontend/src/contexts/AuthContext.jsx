// src/contexts/AuthContext.jsx
import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(localStorage.getItem('accessToken'));
  const [user, setUser] = useState(null); // Здесь можно хранить информацию о пользователе {id, username, full_name, role_id}
  const [isLoading, setIsLoading] = useState(true); // Для начальной проверки токена
  const navigate = useNavigate();

  const API_URL = 'http://localhost:8000'; // Базовый URL вашего API

  // Функция для получения данных пользователя, если есть токен
  const fetchCurrentUser = useCallback(async (currentToken) => {
    if (!currentToken) {
      setUser(null);
      setIsLoading(false);
      return;
    }
    try {
      const response = await fetch(`${API_URL}/users/me/`, {
        headers: { 'Authorization': `Bearer ${currentToken}` },
      });
      if (response.ok) {
        const userData = await response.json();
        setUser(userData);
      } else {
        // Токен невалиден или истек
        localStorage.removeItem('accessToken');
        localStorage.removeItem('tokenType');
        setToken(null);
        setUser(null);
        if (response.status === 401) { // Явный редирект только если не на странице логина
          if (window.location.pathname !== '/login') {
            navigate('/login');
          }
        }
      }
    } catch (error) {
      console.error("Ошибка при получении данных пользователя:", error);
      // Очищаем токен и пользователя в случае ошибки сети или другой проблемы
      localStorage.removeItem('accessToken');
      localStorage.removeItem('tokenType');
      setToken(null);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, [navigate]);

  // Проверяем токен при инициализации провайдера
  useEffect(() => {
    const currentToken = localStorage.getItem('accessToken');
    if (currentToken) {
      setToken(currentToken); // Устанавливаем токен в состояние
      fetchCurrentUser(currentToken);
    } else {
      setIsLoading(false); // Если токена нет, загрузка завершена
    }
  }, [fetchCurrentUser]);


  const login = async (username, password) => {
    setIsLoading(true);
    const formData = new URLSearchParams();
    formData.append('username', username);
    formData.append('password', password);

    try {
      const response = await fetch(`${API_URL}/auth/token`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: formData.toString(),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.detail || 'Ошибка входа');
      }
      localStorage.setItem('accessToken', data.access_token);
      localStorage.setItem('tokenType', data.token_type);
      setToken(data.access_token);
      await fetchCurrentUser(data.access_token); // Загружаем данные пользователя после логина
      navigate('/'); // Перенаправляем на главную после успешного входа
      return true; // Успешный вход
    } catch (error) {
      console.error('Login error:', error);
      setToken(null);
      setUser(null);
      throw error; // Передаем ошибку дальше, чтобы LoginPage мог ее показать
    } finally {
      setIsLoading(false);
    }
  };

  const logout = useCallback(() => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('tokenType');
    setToken(null);
    setUser(null);
    navigate('/login'); // Перенаправляем на страницу входа
  }, [navigate]);

  // Значение, которое будет доступно всем дочерним компонентам
  const value = {
    token,
    user,
    isAuthenticated: !!token, // Простой способ определить аутентификацию
    isLoading, // Полезно для отображения загрузчика на уровне всего приложения
    login,
    logout,
    fetchCurrentUser // Экспортируем, если нужно обновить данные пользователя вручную
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

// Хук для удобного использования контекста
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === null) {
    throw new Error('useAuth должен использоваться внутри AuthProvider');
  }
  return context;
};