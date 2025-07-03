// frontend/src/components/forms/CustomDateInput.jsx

import React, { forwardRef } from 'react';
import { CalendarIcon } from '@heroicons/react/24/solid';

const CustomDateInput = forwardRef(({ value, onClick, placeholder }, ref) => (
  <div className="relative">
    <button
      type="button"
      // ИЗМЕНЕНИЕ 2: Меняем горизонтальный отступ px-3 на pl-10 (слева) и pr-3 (справа)
      className="block w-full appearance-none rounded-md border border-indigo-300 pl-10 pr-3 py-2 text-left text-gray-900 placeholder-indigo-500 focus:z-10 focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 sm:text-sm"
      onClick={onClick}
      ref={ref}
    >
      {value || <span className="text-gray-500">{placeholder}</span>}
    </button>
    {/* ИЗМЕНЕНИЕ 1: Меняем right-3 на left-3, чтобы иконка была слева */}
    <CalendarIcon className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
  </div>
));

export default CustomDateInput;