import React from 'react';

const Button = ({
  children,
  onClick,
  type = 'button',
  variant = 'primary',
  small = false,
  icon,
  className,
  disabled,
  ...props
}) => {
  // --- БАЗОВЫЕ СТИЛИ ---
  // Добавляем transform для анимации и убираем стандартную рамку
  const baseClasses = `inline-flex items-center justify-center font-semibold rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 transition-all duration-200 ease-in-out transform hover:-translate-y-px active:scale-[0.98] border-transparent`;

  // --- СТИЛИ ВАРИАНТОВ ---
  // Улучшаем тени, добавляем градиенты и более сочные цвета
  const variantClasses = {
    primary: 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-lg hover:shadow-xl hover:from-indigo-600 hover:to-purple-700 focus:ring-indigo-500 disabled:from-indigo-400 disabled:to-purple-500 dark:focus:ring-offset-gray-900',
    secondary: 'bg-gray-200 text-gray-800 hover:bg-gray-300 focus:ring-gray-400 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600 dark:focus:ring-gray-500',
    danger: 'bg-gradient-to-r from-red-500 to-rose-600 text-white shadow-lg hover:shadow-xl hover:from-red-600 hover:to-rose-700 focus:ring-red-500 disabled:from-red-400 disabled:to-rose-500',
    ghost: 'bg-transparent text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700',
    icon: 'p-2 bg-transparent text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700 rounded-full',
  };

  // --- РАЗМЕРЫ ---
  // Немного увеличиваем вертикальный padding для лучшего вида
  const sizeClasses = small 
    ? "px-3 py-2 text-xs" 
    : "px-5 py-2.5 text-sm";

  // --- ОТКЛЮЧЕННОЕ СОСТОЯНИЕ ---
  const disabledClasses = disabled ? "opacity-60 cursor-not-allowed shadow-none" : "";

  return (
    <button
      type={type}
      onClick={onClick}
      // Объединяем классы. Обратите внимание, что variantClasses теперь применяется напрямую, а не через переменную.
      className={`${baseClasses} ${variantClasses[variant]} ${sizeClasses} ${disabledClasses} ${className || ''}`}
      disabled={disabled}
      {...props}
    >
      {icon && <span className={children ? "mr-2" : ""}>{icon}</span>}
      {children}
    </button>
  );
};

export default Button;