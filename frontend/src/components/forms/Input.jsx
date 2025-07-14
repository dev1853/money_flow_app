// frontend/src/components/forms/Input.jsx
import React from 'react';
import Label from './Label'; // Предполагаем, что Label уже адаптирован

const Input = ({ type = 'text', label, name, value, onChange, placeholder, error, ...props }) => {
  const hasError = Boolean(error);
  return (
    <div className="w-full">
      {label && <Label htmlFor={name}>{label}</Label>}
      <input
        id={name}
        name={name}
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        // Адаптируем фон, текст, границу и плейсхолдер
        className={`mt-1 block w-full rounded-md border shadow-sm px-3 py-2 text-gray-900 dark:text-gray-200 bg-white dark:bg-gray-700 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 dark:focus:ring-offset-gray-800 focus:ring-indigo-500 ${
          hasError 
          ? 'border-red-500 dark:border-red-600' 
          : 'border-gray-300 dark:border-gray-600'
        }`}
        {...props}
      />
      {hasError && <p className="mt-1 text-xs text-red-600 dark:text-red-500">{error}</p>}
    </div>
  );
};

export default Input;