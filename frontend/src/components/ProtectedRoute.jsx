// frontend/src/components/ProtectedRoute.jsx

import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import MainLayout from '../layouts/MainLayout'; // <-- Убедитесь, что импорт правильный
import Loader from './Loader';

const ProtectedRoute = () => {
  const { isAuthenticated, loading } = useAuth();

  // Пока идет проверка аутентификации, показываем лоадер внутри основного лейаута
  if (loading) {
    return (
      <MainLayout>
        <Loader text="Проверка сессии..." />
      </MainLayout>
    );
  }

  // Когда проверка завершена, и пользователь авторизован,
  // показываем запрошенную страницу внутри лейаута
  if (isAuthenticated) {
    return (
      <MainLayout>
        <Outlet />
      </MainLayout>
    );
  }

  // Если пользователь не авторизован, перенаправляем на страницу входа
  return <Navigate to="/login" replace />;
};

export default ProtectedRoute;