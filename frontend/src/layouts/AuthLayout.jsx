// frontend/src/layouts/AuthLayout.jsx
import React from 'react';
import { Link } from 'react-router-dom'; 
import { ArrowTrendingUpIcon } from '@heroicons/react/24/outline';

const AuthLayout = ({ children, title }) => {
  return (
    // ИЗМЕНЕНИЕ 1: Добавлен класс 'items-center' для идеального горизонтального центрирования
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      
      {/* Блок с логотипом и заголовком */}
      <div className="sm:mx-auto sm:w-full sm:max-w-lg">
        <Link to="/" className="flex justify-center">
          <ArrowTrendingUpIcon className="h-12 w-auto text-indigo-600"/>
        </Link>
        <h2 className="mt-6 text-center text-2xl font-bold leading-9 tracking-tight text-gray-900">
          {title}
        </h2>
      </div>

      {/* Контейнер для формы */}
      <div className="mt-10 sm:mx-auto sm:w-full sm:max-w-lg">
        <div className="bg-white py-8 px-4 shadow-lg sm:rounded-lg sm:px-10">
          {children}
        </div>
      </div>

    </div>
  );
};

export default AuthLayout;