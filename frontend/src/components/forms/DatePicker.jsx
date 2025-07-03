// frontend/src/components/forms/DatePicker.jsx

import React from 'react';
import ReactDatePicker, { registerLocale } from 'react-datepicker';
import { ru } from 'date-fns/locale';
import { format } from 'date-fns';
import CustomInput from './CustomDateInput';
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/solid';

// Импортируем стили
import "./CustomDatePicker.css";

// Импортируем компоненты
import Label from './Label';
// 1. Импортируем наш общий компонент для поля ввода
import CustomDateInput from './CustomDateInput'; 

registerLocale('ru', ru);

// 2. Определение const CustomInput отсюда было полностью удалено, так как мы его импортируем.

const DatePicker = ({ label, id, selected, onChange, ...props }) => {
  return (
    <div className="w-full">
      {label && <Label htmlFor={id} className="mb-1">{label}</Label>}
      <ReactDatePicker
        id={id}
        selected={selected}
        onChange={onChange}
        locale="ru"
        dateFormat="d MMMM yyyy г."
        
        // 3. Здесь теперь используется наш общий, импортированный компонент
        customInput={<CustomInput placeholder={props.placeholderText || 'Выберите дату'}/>}
        
        renderCustomHeader={({
          date,
          decreaseMonth,
          increaseMonth,
          prevMonthButtonDisabled,
          nextMonthButtonDisabled,
        }) => (
          <div className="custom-header-container">
            <button type="button" onClick={decreaseMonth} disabled={prevMonthButtonDisabled}>
              <ChevronLeftIcon className="h-5 w-5" />
            </button>
            <span className="capitalize">{format(date, 'LLLL yyyy', { locale: ru })}</span>
            <button type="button" onClick={increaseMonth} disabled={nextMonthButtonDisabled}>
              <ChevronRightIcon className="h-5 w-5" />
            </button>
          </div>
        )}
        {...props}
      />
    </div>
  );
};

export default DatePicker;