// frontend/src/components/forms/Input.jsx
import React from 'react';
import Label from './Label'; // Предполагаем, что Label уже адаптирован

const baseInputClass = 'h-11 text-base py-2 px-3 rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-200 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 dark:focus:ring-offset-gray-800 focus:ring-indigo-500 shadow-sm';

const Input = ({ type = 'text', label, name, value, onChange, placeholder, error, icon: Icon, ...props }) => {
  const hasError = Boolean(error);
  return (
    <div className="w-full">
      {label && <Label htmlFor={name}>{label}</Label>}
      <div className="relative mt-1">
        {Icon && (
          <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Icon className="h-5 w-5 text-gray-400 dark:text-gray-500" />
          </span>
        )}
        <input
          id={name}
          name={name}
          type={type}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          className={`block w-full ${baseInputClass} ${Icon ? 'pl-10' : ''} ${hasError ? 'border-red-500 dark:border-red-600' : ''}`}
          {...props}
        />
      </div>
      {hasError && <p className="mt-1 text-xs text-red-600 dark:text-red-500">{error}</p>}
    </div>
  );
};

export default Input;