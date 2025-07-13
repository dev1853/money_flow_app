// frontend/src/components/Button.jsx

import React from 'react';

const Button = ({ 
  children, 
  onClick, 
  type = 'button', // Добавляем type по умолчанию
  variant = 'primary', 
  small = false, 
  icon, // Принимаем пропс icon
  className, 
  disabled, // Принимаем пропс disabled
  ...props 
}) => {
  const baseClasses = "inline-flex items-center justify-center px-4 py-2 border text-sm font-medium rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 transition-colors duration-200";
  
  const variantClasses = {
    primary: "border-transparent shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:ring-indigo-500",
    secondary: "border-gray-300 shadow-sm text-gray-700 bg-white hover:bg-gray-50 focus:ring-indigo-500",
    danger: "border-transparent shadow-sm text-white bg-red-600 hover:bg-red-700 focus:ring-red-500",
    success: "border-transparent shadow-sm text-white bg-green-600 hover:bg-green-700 focus:ring-green-500",
    info: "border-transparent shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:ring-blue-500",
  }[variant];

  const sizeClasses = small ? "px-2.5 py-1.5 text-xs" : "";

  const disabledClasses = disabled ? "opacity-50 cursor-not-allowed" : ""; // Классы для disabled состояния

  return (
    <button
      type={type} // Используем переданный type
      onClick={onClick}
      className={`${baseClasses} ${variantClasses} ${sizeClasses} ${disabledClasses} ${className || ''}`}
      disabled={disabled} // Передаем disabled пропс
      {...props}
    >
      {/* ИСПРАВЛЕНИЕ: Добавляем рендеринг иконки */}
      {icon && <span className={children ? "mr-2" : ""}>{icon}</span>}
      {children}
    </button>
  );
};

export default Button;