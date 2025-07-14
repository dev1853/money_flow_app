import React from 'react';
import { useTheme } from '../contexts/ThemeContext';
// Для иконок можно использовать популярную библиотеку, например, 'react-icons'
// npm install react-icons
import { FaSun, FaMoon } from 'react-icons/fa';

const ThemeSwitcher = () => {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      className="p-2 rounded-full text-gray-800 dark:text-yellow-300 bg-gray-200 dark:bg-gray-700 focus:outline-none transition-colors duration-300"
    >
      {theme === 'dark' ? (
        <FaSun size={20} /> // Иконка солнца для темной темы
      ) : (
        <FaMoon size={20} /> // Иконка луны для светлой темы
      )}
    </button>
  );
};

export default ThemeSwitcher;