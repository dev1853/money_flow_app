// frontend/src/layouts/AuthLayout.jsx (Предполагаемый файл)

import React from 'react';
import { Outlet } from 'react-router-dom';

const AuthLayout = () => {
  return (
    // Адаптируем фон и базовый цвет текста для гостевых страниц
    <div className="flex min-h-screen flex-col justify-center bg-gray-100 dark:bg-gray-900 py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        {/* Здесь можно разместить логотип */}
      </div>
      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        {/* Адаптируем фон карточки */}
        <div className="bg-white dark:bg-gray-800 py-8 px-4 shadow-lg sm:rounded-lg sm:px-10 border border-gray-200 dark:border-gray-700">
          <Outlet /> {/* Здесь будут LoginPage, RegisterPage */}
        </div>
      </div>
    </div>
  );
};

export default AuthLayout;