import React, { forwardRef } from 'react';
import { CalendarIcon } from '@heroicons/react/24/solid';

const CustomDateInput = forwardRef(({ value, onClick, placeholder, className }, ref) => (
  <div className="relative w-full">
    <input
      type="text"
      // Добавляем классы для фона, границы, текста и плейсхолдера в темной теме
      className={`mt-1 block w-full rounded-md border border-gray-300 dark:border-gray-600 shadow-sm px-3 py-2.5 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-200 placeholder-gray-500 dark:placeholder-gray-400 focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm ${className}`}
      onClick={onClick}
      value={value}
      placeholder={placeholder}
      readOnly
      ref={ref}
    />
    <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
      {/* Адаптируем цвет иконки */}
      <CalendarIcon className="h-5 w-5 text-gray-400 dark:text-gray-500" aria-hidden="true" />
    </div>
  </div>
));

export default CustomDateInput;