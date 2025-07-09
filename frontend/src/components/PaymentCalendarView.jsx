// /frontend/src/components/PaymentCalendarView.jsx

import React from 'react';
import { formatCurrency, formatDate } from '../utils/formatting';

// Внутренний компонент для отрисовки одной ячейки (дня)
const CalendarDay = ({ day, onDayClick }) => {
    const isToday = formatDate(new Date()) === formatDate(new Date(day.date + 'T00:00:00'));

    let cellClasses = 'relative p-2 h-32 border-t border-r border-gray-200 cursor-pointer transition-colors hover:bg-gray-100';
    if (day.is_cash_gap) cellClasses += ' bg-red-50 hover:bg-red-100';
    
    let dayNumberClasses = 'flex items-center justify-center h-6 w-6 rounded-full text-sm';
    if (isToday) {
        dayNumberClasses += ' bg-indigo-600 text-white font-bold';
    } else {
        dayNumberClasses += ' font-semibold text-gray-800';
    }

    return (
        <div className={cellClasses} onClick={() => onDayClick(day.date)}>
            <div className="flex justify-end">
                <time dateTime={day.date} className={dayNumberClasses}>
                    {new Date(day.date + 'T00:00:00').getDate()}
                </time>
            </div>
            <div className="mt-1 text-xs space-y-1">
                {day.income > 0 && <p className="text-green-600 truncate" title={`Поступления: ${formatCurrency(day.income)}`}>+ {formatCurrency(day.income)}</p>}
                {day.expense > 0 && <p className="text-red-600 truncate" title={`Списания: ${formatCurrency(day.expense)}`}>- {formatCurrency(day.expense)}</p>}
            </div>
            <div className="absolute bottom-2 right-2 text-xs font-bold">
                <span className={day.balance_end < 0 ? 'text-red-600' : 'text-gray-500'}>{formatCurrency(day.balance_end)}</span>
            </div>
        </div>
    );
};

// Основной компонент-контейнер календаря
const PaymentCalendarView = ({ calendarData, currentDate, onDayClick }) => {
    const weekdays = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];
    
    if (!calendarData || !calendarData.calendar_days) {
        return null; // Не рендерим ничего, если данных нет
    }

    const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    const startingDayOfWeek = (firstDayOfMonth.getDay() + 6) % 7; 
    const emptyCells = Array.from({ length: startingDayOfWeek }, (_, i) => <div key={`empty-${i}`} className="border-t border-r border-gray-200"></div>);

    return (
        <div className="bg-white shadow-lg rounded-lg border border-gray-200">
            {/* ... Шапка с балансами ... */}
            <div className="p-4 border-b grid grid-cols-2 gap-4">
                <div>
                    <p className="text-sm text-gray-600">Начальный баланс</p>
                    <p className="text-2xl font-bold text-gray-800">{formatCurrency(calendarData.start_balance)}</p>
                </div>
                <div className="text-right">
                    <p className="text-sm text-gray-600">Прогноз на конец периода</p>
                    <p className={`text-2xl font-bold ${calendarData.end_balance >= 0 ? 'text-gray-800' : 'text-red-600'}`}>
                        {formatCurrency(calendarData.end_balance)}
                    </p>
                </div>
            </div>

            {/* Сетка календаря */}
            <div className="grid grid-cols-7">
                {weekdays.map(day => <div key={day} className="py-2 text-center text-sm font-semibold text-gray-600 border-r border-b border-gray-200">{day}</div>)}
                {emptyCells}
                {calendarData.calendar_days.map(day => (
                    <CalendarDay key={day.date} day={day} onDayClick={onDayClick} />
                ))}
            </div>
        </div>
    );
};

export default PaymentCalendarView;