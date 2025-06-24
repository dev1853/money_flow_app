import React from 'react';
import DatePicker from './DatePicker'; 
import Label from './Label';

function DateRangePicker({ startDate, endDate, onStartDateChange, onEndDateChange }) {
  return (
    <div>
      <Label>Период</Label>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-1">
        <DatePicker
          selected={startDate}
          onChange={onStartDateChange}
          selectsStart
          startDate={startDate}
          endDate={endDate}
          placeholderText="Дата С"
        />
        <DatePicker
          selected={endDate}
          onChange={onEndDateChange}
          selectsEnd
          startDate={startDate}
          endDate={endDate}
          minDate={startDate}
          placeholderText="Дата ПО"
        />
      </div>
    </div>
  );
}

export default DateRangePicker;