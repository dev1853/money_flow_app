import React from 'react';

const Button = ({
  children,
  onClick,
  type = 'button',
  variant = 'primary',
  small = false,
  fullWidth = false, // <-- 1. Добавили свойство fullWidth
  icon,
  className,
  disabled,
  ...rest // <-- 2. Собираем все остальные стандартные атрибуты <button>
}) => {
  // --- БАЗОВЫЕ СТИЛИ ---
  const baseClasses = `inline-flex items-center justify-center font-semibold rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 transition-all duration-200 ease-in-out transform hover:-translate-y-px active:scale-[0.98] border-transparent`;

  // --- СТИЛИ ВАРИАНТОВ ---
  const variantClasses = {
    primary: 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-lg hover:shadow-xl hover:from-indigo-600 hover:to-purple-700 focus:ring-indigo-500 disabled:from-indigo-400 disabled:to-purple-500 dark:focus:ring-offset-gray-900',
    secondary: 'bg-gray-200 text-gray-800 hover:bg-gray-300 focus:ring-gray-400 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600 dark:focus:ring-gray-500',
    danger: 'bg-gradient-to-r from-red-500 to-rose-600 text-white shadow-lg hover:shadow-xl hover:from-red-600 hover:to-rose-700 focus:ring-red-500 disabled:from-red-400 disabled:to-rose-500',
    ghost: 'bg-transparent text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700',
    icon: 'p-2 bg-transparent text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700 rounded-full',
  };

  // --- РАЗМЕРЫ ---
  const sizeClasses = small 
    ? "px-3 py-2 text-xs" 
    : "px-5 py-2.5 text-sm";
  
  // --- ДОПОЛНИТЕЛЬНЫЕ КЛАССЫ ---
  const otherClasses = [
    disabled ? "opacity-60 cursor-not-allowed shadow-none" : "", // Состояние "отключено"
    fullWidth ? "w-full" : "", // 3. Используем fullWidth для добавления класса
    className || "" // Добавляем любые классы, переданные извне
  ].join(' ');

  return (
    <button
      type={type}
      onClick={onClick}
      className={`${baseClasses} ${variantClasses[variant]} ${sizeClasses} ${otherClasses}`}
      disabled={disabled}
      {...rest} // <-- 4. Передаем только "родные" атрибуты HTML, а не наши кастомные
    >
      {/* Если есть иконка, добавляем отступ, только если есть и текст */}
      {icon && <span className={children ? "mr-2" : ""}>{icon}</span>}
      {children}
    </button>
  );
};

export default Button;