// frontend/src/components/forms/CustomDateInput.jsx

import React, { forwardRef } from 'react';
import { CalendarIcon } from '@heroicons/react/24/solid';

const CustomDateInput = forwardRef(({ value, onClick, placeholder, className }, ref) => (
  <div className="relative w-full">
    <input
      type="text"
      className={`block w-full rounded-md border border-gray-300 shadow-sm px-3 py-2.5 text-gray-900 placeholder-gray-500 focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm ${className}`} // ИСПРАВЛЕНО: Изменено py-2 на py-2.5
      onClick={onClick}
      value={value}
      placeholder={placeholder}
      readOnly // Добавляем readOnly, чтобы предотвратить ручной ввод
      ref={ref}
    />
    <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
      <CalendarIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
    </div>
  </div>
));

export default CustomDateInput;