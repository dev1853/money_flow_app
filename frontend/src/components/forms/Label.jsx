import React from 'react';

const Label = ({ htmlFor, children, className = '' }) => {
  return (
    <label
      htmlFor={htmlFor}
      // Добавляем цвет текста для темной темы
      className={`block text-sm font-medium text-gray-700 dark:text-gray-300 ${className}`}
    >
      {children}
    </label>
  );
};

export default Label;