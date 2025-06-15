// frontend/src/components/forms/Label.jsx
import React from 'react';

const Label = ({ htmlFor, children, className = '' }) => { // Добавляем className = ''
  return (
    <label
      htmlFor={htmlFor}
      className={`block text-sm font-medium text-gray-700 ${className}`} // Объединяем базовые и переданные классы
    >
      {children}
    </label>
  );
};

export default Label;