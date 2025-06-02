// src/layouts/AuthLayout.jsx
import React from 'react';
import { Link } from 'react-router-dom'; // <-- 1. Импортируем Link
import { ArrowTrendingUpIcon } from '@heroicons/react/24/outline'; // <-- 2. Импортируем иконку (используем outline как в Sidebar)

const AuthLayout = ({ children }) => {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="mb-10"> {/* Увеличил немного нижний отступ */}
        {/* --- ЗАМЕНА ЗДЕСЬ --- */}
        <Link to="/" className="flex flex-col items-center group text-decoration-none focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 rounded-md">
          <ArrowTrendingUpIcon 
            className="h-12 w-12 text-indigo-600 group-hover:text-indigo-500 transition-colors" // Сделал иконку чуть больше
            aria-hidden="true" 
          />
          <span className="mt-3 text-3xl font-bold tracking-tight text-indigo-600 group-hover:text-indigo-500 transition-colors">
            Финансы {/* Или "Система Учета Финансов", если предпочитаете */}
          </span>
        </Link>
        {/* --- КОНЕЦ ЗАМЕНЫ --- */}
      </div>
      <div className="w-full max-w-md"> 
        <div className="bg-white py-8 px-6 shadow-xl rounded-lg sm:px-10"> {/* Немного изменил padding для консистентности */}
          {children}
        </div>
      </div>
    </div>
  );
};

export default AuthLayout;