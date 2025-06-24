// src/layouts/AuthLayout.jsx

import React from 'react';
import { Link } from 'react-router-dom'; 
import { CircleStackIcon } from '@heroicons/react/24/outline';

const AuthLayout = ({ title, children }) => {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-white py-12 px-4 sm:px-6 lg:px-8">
      {/* ИЗМЕНЕНО: Иконка и название в одном блоке, описание ниже */}
      <div className="mb-8 text-center"> {/* Общий контейнер для логотипа и слогана */}
        <div className="flex items-center justify-center group mb-2"> {/* Иконка и название в ряд, центрированы */}
          <CircleStackIcon 
            className="h-10 w-10 text-indigo-600 group-hover:text-indigo-500 transition-colors" // Увеличены h и w
            aria-hidden="true" 
          />
          <span className="ml-3 text-3xl font-extrabold text-gray-900">Казна</span> {/* Увеличен размер текста */}
        </div>
        <p className="mt-1 text-center text-sm text-gray-600"> {/* Отдельный P для слогана, центрирован */}
          Система учета финансов для бизнеса.
        </p>
      </div>
        
      <div className="w-full max-w-md"> 
          {children}
      </div>
    </div>
  );
};

export default AuthLayout;