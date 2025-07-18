import React, { forwardRef } from 'react';
import { CalendarIcon } from '@heroicons/react/24/outline';

const baseInputClass = 'h-11 text-base py-2 px-3 rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-200 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 dark:focus:ring-offset-gray-800 focus:ring-indigo-500 shadow-sm appearance-none';

const CustomDateInput = forwardRef(({ value, onClick, placeholder, className }, ref) => (
  <div className="relative w-full mt-1">
    <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
      <CalendarIcon className="h-5 w-5 text-gray-400 dark:text-gray-500" aria-hidden="true" />
    </span>
    <input
      type="text"
      className={`block w-full ${baseInputClass} pl-10 ${className}`}
      onClick={onClick}
      value={value}
      placeholder={placeholder}
      readOnly
      ref={ref}
    />
  </div>
));

export default CustomDateInput;