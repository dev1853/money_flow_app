import React from 'react';
import ReactDatePicker, { registerLocale } from 'react-datepicker';
import { ru } from 'date-fns/locale';
import { format } from 'date-fns';
import { ChevronLeftIcon, ChevronRightIcon, CalendarIcon } from '@heroicons/react/24/solid';
import "./CustomDatePicker.css"; // Подключаем наши стили

import Label from './Label';
import Input from './Input';

registerLocale('ru', ru);

// Кастомный input с иконкой, который мы передадим в DatePicker
const CustomInput = React.forwardRef(({ value, onClick, placeholder }, ref) => (
  <div className="relative w-full">
    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
        <CalendarIcon className="h-5 w-5 text-gray-400" />
    </div>
    <Input
        className="pl-10 !bg-white" // Добавляем !bg-white, чтобы readOnly не делал фон серым
        onClick={onClick}
        ref={ref}
        value={value}
        placeholder={placeholder}
        readOnly
    />
  </div>
));

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
        customInput={<CustomInput placeholder={props.placeholderText}/>}
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