// frontend/src/components/forms/Select.jsx
import React from 'react';
import Label from './Label';

const baseSelectClass = 'h-11 text-base py-2 px-3 rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 dark:focus:ring-offset-gray-800 focus:ring-indigo-500 shadow-sm appearance-none pr-8';

const ChevronIcon = ({ className = '' }) => (
  <svg className={`w-4 h-4 pointer-events-none ${className}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
  </svg>
);

const Select = ({ label, name, value, onChange, options, children, error, className = '', icon: Icon, ...props }) => {
  const hasError = Boolean(error);
  return (
    <div className={`relative w-full ${className}`}>
      {label && <Label htmlFor={name}>{label}</Label>}
      <div className="relative mt-1">
        {Icon && (
          <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Icon className="h-5 w-5 text-gray-400 dark:text-gray-500" />
          </span>
        )}
        <select
          id={name}
          name={name}
          value={value}
          onChange={onChange}
          aria-label={label || name}
          className={`block w-full ${baseSelectClass} ${Icon ? 'pl-10' : ''} ${hasError ? 'border-red-500 dark:border-red-600' : ''}`}
          {...props}
        >
          {options
            ? options.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))
            : children}
        </select>
        {/* Кастомная иконка стрелки */}
        <span className="pointer-events-none absolute inset-y-0 right-2 flex items-center">
          <ChevronIcon className="text-gray-400 dark:text-gray-500" />
        </span>
      </div>
      {hasError && <p className="mt-1 text-xs text-red-600 dark:text-red-400">{error}</p>}
    </div>
  );
};

export default Select;