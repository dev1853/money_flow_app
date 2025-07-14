// frontend/src/components/forms/Checkbox.jsx
import React from 'react';

const Checkbox = ({ id, name, checked, onChange, label, className = '' }) => (
  <div className={`flex items-center ${className}`}>
    <input
      id={id}
      name={name}
      type="checkbox"
      checked={checked}
      onChange={onChange}
      // 1. Adapt checkbox styles for dark mode
      className="h-4 w-4 rounded border-gray-300 dark:border-gray-600 bg-gray-100 dark:bg-gray-700 text-indigo-600 focus:ring-indigo-500 dark:focus:ring-indigo-600 dark:ring-offset-gray-800"
    />
    {/* 2. Adapt label styles for dark mode */}
    <label htmlFor={id} className="ml-2 block text-sm text-gray-900 dark:text-gray-300">
      {label}
    </label>
  </div>
);

export default Checkbox;