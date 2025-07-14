import React from 'react';
import { formatCurrency, formatDate } from '../utils/formatting';

// 1. Adapt the CalendarDay sub-component
const CalendarDay = ({ day, onDayClick }) => {
    const isToday = formatDate(new Date()) === formatDate(new Date(day.date + 'T00:00:00'));

    // Adapt cell classes for background, border, hover, and cash gap states
    let cellClasses = 'relative p-2 h-32 border-t border-r border-gray-200 dark:border-gray-700 cursor-pointer transition-colors';
    if (day.is_cash_gap) {
        cellClasses += ' bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/30';
    } else {
        cellClasses += ' bg-white dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700/50';
    }
    
    // Adapt the day number circle for "today" and default states
    let dayNumberClasses = 'flex items-center justify-center h-6 w-6 rounded-full text-sm';
    if (isToday) {
        dayNumberClasses += ' bg-indigo-600 dark:bg-indigo-500 text-white font-bold';
    } else {
        dayNumberClasses += ' font-semibold text-gray-800 dark:text-gray-200';
    }

    return (
        <div className={cellClasses} onClick={() => onDayClick(day.date)}>
            <div className="flex justify-end">
                <time dateTime={day.date} className={dayNumberClasses}>
                    {new Date(day.date + 'T00:00:00').getDate()}
                </time>
            </div>
            <div className="mt-1 text-xs space-y-1">
                {/* Adapt income/expense text */}
                {day.income > 0 && <p className="text-green-600 dark:text-green-400 truncate" title={`Поступления: ${formatCurrency(day.income)}`}>+ {formatCurrency(day.income)}</p>}
                {day.expense > 0 && <p className="text-red-600 dark:text-red-400 truncate" title={`Списания: ${formatCurrency(day.expense)}`}>- {formatCurrency(day.expense)}</p>}
            </div>
            <div className="absolute bottom-2 right-2 text-xs font-bold">
                {/* Adapt final balance text */}
                <span className={day.balance_end < 0 ? 'text-red-600 dark:text-red-400' : 'text-gray-500 dark:text-gray-400'}>{formatCurrency(day.balance_end)}</span>
            </div>
        </div>
    );
};

// Main calendar container component
const PaymentCalendarView = ({ calendarData, currentDate, onDayClick }) => {
    const weekdays = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];
    
    if (!calendarData || !calendarData.calendar_days) {
        return null;
    }

    const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    const startingDayOfWeek = (firstDayOfMonth.getDay() + 6) % 7; 
    // Adapt empty cells
    const emptyCells = Array.from({ length: startingDayOfWeek }, (_, i) => <div key={`empty-${i}`} className="border-t border-r border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50"></div>);

    return (
        // Adapt the main container
        <div className="bg-white dark:bg-gray-800 shadow-lg rounded-lg border border-gray-200 dark:border-gray-700">
            {/* Adapt the header block */}
            <div className="p-4 border-b border-gray-200 dark:border-gray-700 grid grid-cols-2 gap-4">
                <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Начальный баланс</p>
                    <p className="text-2xl font-bold text-gray-800 dark:text-gray-100">{formatCurrency(calendarData.start_balance)}</p>
                </div>
                <div className="text-right">
                    <p className="text-sm text-gray-600 dark:text-gray-400">Прогноз на конец периода</p>
                    <p className={`text-2xl font-bold ${calendarData.end_balance >= 0 ? 'text-gray-800 dark:text-gray-100' : 'text-red-600 dark:text-red-400'}`}>
                        {formatCurrency(calendarData.end_balance)}
                    </p>
                </div>
            </div>

            {/* Calendar grid */}
            <div className="grid grid-cols-7">
                {/* Adapt weekday headers */}
                {weekdays.map(day => <div key={day} className="py-2 text-center text-sm font-semibold text-gray-600 dark:text-gray-300 border-r border-b border-gray-200 dark:border-gray-700">{day}</div>)}
                {emptyCells}
                {calendarData.calendar_days.map(day => (
                    <CalendarDay key={day.date} day={day} onDayClick={onDayClick} />
                ))}
            </div>
        </div>
    );
};

export default PaymentCalendarView;