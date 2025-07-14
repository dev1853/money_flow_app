import React from 'react';
import DatePicker, { registerLocale } from 'react-datepicker';
import { getYear, getMonth } from 'date-fns';
import { ru } from 'date-fns/locale';
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/solid';
import CustomDateInput from './CustomDateInput'; // This is already adapted
import Button from '../Button'; // This is already adapted

import 'react-datepicker/dist/react-datepicker.css';
import './CustomDatePicker.css'; // We will update this file next

registerLocale('ru', ru);

const CustomHeader = ({
  date,
  changeYear,
  changeMonth,
  decreaseMonth,
  increaseMonth,
  prevMonthButtonDisabled,
  nextMonthButtonDisabled,
}) => {
  const years = Array.from({ length: 16 }, (_, i) => getYear(new Date()) - 10 + i);
  const months = ["Январь", "Февраль", "Март", "Апрель", "Май", "Июнь", "Июль", "Август", "Сентябрь", "Октябрь", "Ноябрь", "Декабрь"];

  return (
    <div className="custom-header-container">
      {/* The Button component is already adapted */}
      <Button type="button" variant="icon" onClick={decreaseMonth} disabled={prevMonthButtonDisabled}>
        <ChevronLeftIcon className="h-5 w-5" />
      </Button>
      <div className="flex space-x-2">
        {/* Adapt the <select> elements for dark mode */}
        <select
          value={months[getMonth(date)]}
          onChange={({ target: { value } }) => changeMonth(months.indexOf(value))}
          className="rounded-md border-gray-300 text-sm font-semibold focus:ring-0 focus:border-indigo-500 bg-white dark:bg-gray-700 dark:text-gray-200 dark:border-gray-600"
        >
          {months.map((option) => (
            <option key={option} value={option}>{option}</option>
          ))}
        </select>
        <select
          value={getYear(date)}
          onChange={({ target: { value } }) => changeYear(value)}
          className="rounded-md border-gray-300 text-sm font-semibold focus:ring-0 focus:border-indigo-500 bg-white dark:bg-gray-700 dark:text-gray-200 dark:border-gray-600"
        >
          {years.map((option) => (
            <option key={option} value={option}>{option}</option>
          ))}
        </select>
      </div>
      <Button type="button" variant="icon" onClick={increaseMonth} disabled={nextMonthButtonDisabled}>
        <ChevronRightIcon className="h-5 w-5" />
      </Button>
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
      placeholderText="Выберите диапазон"
      customInput={<CustomDateInput />}
      renderCustomHeader={CustomHeader}
      // These props are not needed if you use renderCustomHeader
      // showMonthDropdown
      // showYearDropdown
      // dropdownMode="select"
    />
  );
};

export default DateRangePicker;