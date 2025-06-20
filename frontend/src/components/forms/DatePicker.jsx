// frontend/src/components/forms/DatePicker.jsx

import React from 'react';
import ReactDatePicker, { registerLocale } from 'react-datepicker';
import { ru } from 'date-fns/locale';
import "react-datepicker/dist/react-datepicker.css";

import Label from './Label';

// Регистрируем русскую локаль для всей библиотеки
registerLocale('ru', ru);

const DatePicker = ({ label, id, selected, onChange, ...props }) => {
  return (
    <div className="w-full">
      {/* Отображаем Label, если он был передан */}
      {label && <Label htmlFor={id}>{label}</Label>}
      
      <ReactDatePicker
        id={id}
        selected={selected}
        onChange={onChange}
        locale="ru" // Устанавливаем локаль по умолчанию
        dateFormat="dd.MM.yyyy" // Устанавливаем формат даты по умолчанию
        // Стили, аналогичные нашему компоненту Input, для единообразия
        className="w-full mt-1 border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
        placeholderText="дд.мм.гггг"
        {...props} // Передаем любые другие пропсы, которые могут понадобиться
      />
    </div>
  );
};

export default DatePicker;