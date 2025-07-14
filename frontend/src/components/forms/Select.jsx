// frontend/src/components/forms/Select.jsx
import React from 'react';
import Label from './Label';

const Select = ({ label, name, value, onChange, options, children, error, ...props }) => {
  const hasError = Boolean(error);
  
  return (
    <div className="w-full">
      {label && <Label htmlFor={name}>{label}</Label>}
      <select
        id={name}
        name={name}
        value={value}
        onChange={onChange}
        className={`mt-1 block w-full rounded-md border shadow-sm px-3 py-2.5 text-gray-900 dark:text-gray-200 bg-white dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 dark:focus:ring-offset-gray-800 focus:ring-indigo-500 ${
          hasError 
          ? 'border-red-500 dark:border-red-600' 
          : 'border-gray-300 dark:border-gray-600'
        }`}
        {...props}
      >
        {/* 👇 ВОТ КЛЮЧЕВОЕ ИСПРАВЛЕНИЕ 👇 */}
        {/* Если передан массив options, используем его. Иначе - используем дочерние элементы. */}
        {options 
          ? options.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))
          : children
        }
      </select>
      {hasError && <p className="mt-1 text-xs text-red-600 dark:text-red-400">{error}</p>}
    </div>
  );
};

export default Select;