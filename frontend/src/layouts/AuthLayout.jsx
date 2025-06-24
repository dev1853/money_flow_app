// src/layouts/AuthLayout.jsx

import React from 'react';
import { Link } from 'react-router-dom'; 
import { ArrowTrendingUpIcon } from '@heroicons/react/24/outline';

// Принимаем title как пропс, чтобы показывать "Вход" или "Регистрация"
const AuthLayout = ({ title, children }) => {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-white py-12 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-md"> 
          {children}
      </div>
    </div>
  );
};

export default AuthLayout;