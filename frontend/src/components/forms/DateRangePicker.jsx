// frontend/src/components/forms/DateRangePicker.jsx

import React, { forwardRef } from 'react';
import DatePicker, { registerLocale } from 'react-datepicker';
import { getYear, getMonth } from 'date-fns'; // <-- Добавили getMonth
import { ru } from 'date-fns/locale';
import { ChevronLeftIcon, ChevronRightIcon, CalendarIcon } from '@heroicons/react/24/solid';
import CustomDateInput from './CustomDateInput';

import 'react-datepicker/dist/react-datepicker.css';
import './CustomDatePicker.css';

registerLocale('ru', ru);

// --- ИЗМЕНЕНИЕ: Улучшаем CustomHeader, добавляя выпадающие списки ---
const CustomHeader = ({
  date,
  changeYear,
  changeMonth,
  decreaseMonth,
  increaseMonth,
  prevMonthButtonDisabled,
  nextMonthButtonDisabled,
}) => {
  // Генерируем список лет (например, 10 лет назад и 5 вперед)
  const years = Array.from(
    { length: 16 },
    (_, i) => getYear(new Date()) - 10 + i
  );
  
  // Список месяцев на русском языке
  const months = [
    "Январь", "Февраль", "Март", "Апрель", "Май", "Июнь",
    "Июль", "Август", "Сентябрь", "Октябрь", "Ноябрь", "Декабрь"
  ];

  return (
    <div className="custom-header-container">
      <button type="button" onClick={decreaseMonth} disabled={prevMonthButtonDisabled} className="p-1 rounded-full hover:bg-gray-100">
        <ChevronLeftIcon className="h-5 w-5" />
      </button>
      <div className="flex space-x-2">
        <select
          value={months[getMonth(date)]}
          onChange={({ target: { value } }) => changeMonth(months.indexOf(value))}
          className="rounded-md border-gray-300 text-sm font-semibold focus:ring-0 focus:border-indigo-500"
        >
          {months.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
        <select
          value={getYear(date)}
          onChange={({ target: { value } }) => changeYear(value)}
          className="rounded-md border-gray-300 text-sm font-semibold focus:ring-0 focus:border-indigo-500"
        >
          {years.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      </div>

      <button type="button" onClick={increaseMonth} disabled={nextMonthButtonDisabled} className="p-1 rounded-full hover:bg-gray-100">
        <ChevronRightIcon className="h-5 w-5" />
      </button>
    </div>
  );
};


const DateRangePicker = ({ startDate, endDate, onStartDateChange, onEndDateChange }) => {
  const onChange = (dates) => {
    const [start, end] = dates;
    onStartDateChange(start);
    onEndDateChange(end);
  };

  return (
    <DatePicker
      selected={startDate}
      onChange={onChange}
      startDate={startDate}
      endDate={endDate}
      selectsRange
      isClearable
      locale="ru"
      dateFormat="dd.MM.yyyy"
      placeholderText="Выберите диапазон дат"
      customInput={<CustomDateInput />}
      renderCustomHeader={CustomHeader}

      // --- ИЗМЕНЕНИЕ: Включаем встроенные выпадающие списки ---
      showMonthDropdown
      showYearDropdown
      dropdownMode="select" // Стандартный <select> вместо скролла
    />
  );
};

export default DateRangePicker;