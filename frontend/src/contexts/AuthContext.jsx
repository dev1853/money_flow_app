// frontend/src/contexts/AuthContext.jsx
import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiService, ApiError } from '../services/apiService'; // Используем apiService

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(localStorage.getItem('accessToken')); //
  const [user, setUser] = useState(null); //
  const [isLoading, setIsLoading] = useState(true); // Отвечает за начальную проверку токена и загрузку пользователя
  const navigate = useNavigate(); //

  const fetchCurrentUser = useCallback(async (currentToken) => { //
    if (!currentToken) {
      setUser(null);
      setIsLoading(false); // Завершаем загрузку, если токена нет
      return;
    }
    // Не устанавливаем setIsLoading(true) здесь повторно, если уже установлено в useEffect или login
    try {
      const userData = await apiService.get('/users/me/'); // apiService добавит токен
      setUser(userData); //
    } catch (error) { //
      console.error("Ошибка при получении данных пользователя:", error);
      localStorage.removeItem('accessToken'); //
      localStorage.removeItem('tokenType'); //
      setToken(null); //
      setUser(null); //
      if (error instanceof ApiError && error.status === 401) {
        // Не редиректим, если мы уже на странице входа или регистрации, чтобы избежать цикла
        if (window.location.pathname !== '/login' && window.location.pathname !== '/register') {
          navigate('/login'); //
        }
      }
    } finally {
      setIsLoading(false); // Завершаем общую загрузку состояния аутентификации
    }
  }, [navigate]); //

  useEffect(() => { //
    const currentToken = localStorage.getItem('accessToken');
    if (currentToken) {
      setToken(currentToken); // Устанавливаем токен в состояние
      fetchCurrentUser(currentToken);
    } else {
      setIsLoading(false); // Если токена нет, первичная загрузка состояния аутентификации завершена
    }
  }, [fetchCurrentUser]); //


  const login = async (username, password) => { //
    setIsLoading(true); // Начинаем процесс входа, устанавливаем isLoading
    // setError(null); // Сбрасываем предыдущие ошибки (если есть общее состояние ошибки в AuthContext)
                  // Если setError не определен здесь, этот вызов нужно убрать или добавить стейт ошибки в AuthContext
    const formData = new URLSearchParams(); //
    formData.append('username', username); //
    formData.append('password', password); //

    try {
      const data = await apiService.post('/auth/token', formData, { //
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' } //
      });
      
      localStorage.setItem('accessToken', data.access_token); //
      localStorage.setItem('tokenType', data.token_type); //
      setToken(data.access_token); //
      await fetchCurrentUser(data.access_token); // Загружаем данные пользователя после логина, это установит setIsLoading(false)
      return true; // Успешный вход
    } catch (error) { //
      console.error('Login error:', error); //
      localStorage.removeItem('accessToken');
      localStorage.removeItem('tokenType');
      setToken(null); //
      setUser(null); //
      setIsLoading(false); // Завершаем загрузку и в случае ошибки входа
      throw error instanceof ApiError ? new Error(error.message || 'Не удалось войти.') : error; // Пробрасываем ошибку для LoginPage
    } 
    // finally { setIsLoading(false); } // Убрано, так как fetchCurrentUser имеет свой finally
  };

  const logout = useCallback(() => { //
    localStorage.removeItem('accessToken'); //
    localStorage.removeItem('tokenType'); //
    setToken(null); //
    setUser(null); //
    setIsLoading(false); // Устанавливаем isLoading в false, так как пользователь точно не аутентифицирован
    navigate('/login'); //
  }, [navigate]); //

  const value = { //
    token,
    user,
    isAuthenticated: !!token,
    isLoading, // Этот isLoading теперь отражает общее состояние готовности AuthContext
    login,
    logout,
    fetchCurrentUser // Экспортируем на случай, если понадобится обновить данные пользователя вручную
  };

  return (
    <AuthContext.Provider value={value}> {/* */}
      {children}
    </AuthContext.Provider>
  );
};

// Хук useAuth остается без изменений
export const useAuth = () => { //
  const context = useContext(AuthContext);
  if (context === null) {
    throw new Error('useAuth должен использоваться внутри AuthProvider');
  }
  return context;
};