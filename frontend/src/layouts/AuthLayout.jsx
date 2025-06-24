// src/layouts/AuthLayout.jsx

import React from 'react';
import { Link } from 'react-router-dom'; 
import { ArrowTrendingUpIcon } from '@heroicons/react/24/outline';

// Принимаем title как пропс, чтобы показывать "Вход" или "Регистрация"
const AuthLayout = ({ title, children }) => {
  return (
    <div className="flex min-h-full flex-1 flex-col justify-center bg-gray-50 px-6 py-12 lg:px-8">
      <div>
        {/* Общий логотип и название */}
        <div className="flex justify-center">
            <ArrowTrendingUpIcon 
              className="h-12 w-12 text-indigo-600" 
              aria-hidden="true" 
            />
        </div>
        <h2 className="mt-6 text-center text-3xl font-bold tracking-tight text-indigo-600">
          Поток денег
        </h2>
        {/* Заголовок страницы, который мы передаем */}
        <p className="mt-2 text-center text-sm text-gray-600">
          {title}
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-sm">
        <div>
          {/* Сюда будет вставлена сама форма (children) */}
          {children} 
        </div>
      </div>
    </div>
  );
};

export default AuthLayout;