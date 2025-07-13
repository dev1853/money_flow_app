// frontend/src/components/forms/DatePicker.jsx

import React from 'react';
import ReactDatePicker, { registerLocale } from 'react-datepicker';
import { ru } from 'date-fns/locale';
import { format } from 'date-fns';
// ИСПРАВЛЕНИЕ: Удаляем дублирующий импорт CustomDateInput
// import CustomInput from './CustomDateInput'; // Эта строка теперь не нужна
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/solid';

// Импортируем стили
import "./CustomDatePicker.css";

// Импортируем компоненты
import Label from './Label';
// ИСПРАВЛЕНИЕ: Используем один правильный импорт CustomDateInput
import CustomDateInput from './CustomDateInput'; 

registerLocale('ru', ru);

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
        
        // ИСПРАВЛЕНИЕ: Используем корректное имя импортированного компонента CustomDateInput
        customInput={<CustomDateInput placeholder={props.placeholderText || 'Выберите дату'}/>}
        
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