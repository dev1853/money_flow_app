import React from 'react';
import { formatCurrency, formatDate } from '../utils/formatting';

// 1. Adapt the CalendarRow sub-component
const CalendarRow = ({ dayData, onDayClick }) => {
    // 2. Add dark mode variants to dynamic colors
    const endBalanceColor = dayData.balance_end >= 0 ? 'text-gray-900 dark:text-gray-100' : 'text-red-600 dark:text-red-400 font-bold';
    
    // 3. Adapt the row background for cash gaps and hover states
    const rowClass = dayData.is_cash_gap 
        ? 'bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/30 cursor-pointer' 
        : 'hover:bg-gray-50 dark:hover:bg-gray-700/50 cursor-pointer';

    return (
        <tr className={`${rowClass} transition-colors`} onClick={() => onDayClick(dayData.date)}>
            {/* Adapt text colors in cells */}
            <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-800 dark:text-gray-200">
                {formatDate(new Date(dayData.date + 'T00:00:00'))}
            </td>
            <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400 text-right">
                {formatCurrency(dayData.balance_start)}
            </td>
            <td className="px-4 py-3 whitespace-nowrap text-sm text-right font-medium text-green-600 dark:text-green-400">
                {dayData.income > 0 ? `+${formatCurrency(dayData.income)}` : '—'}
            </td>
            <td className="px-4 py-3 whitespace-nowrap text-sm text-right font-medium text-red-600 dark:text-red-400">
                {dayData.expense > 0 ? `-${formatCurrency(dayData.expense)}` : '—'}
            </td>
            <td className={`px-4 py-3 whitespace-nowrap text-sm text-right font-semibold ${endBalanceColor}`}>
                {formatCurrency(dayData.balance_end)}
            </td>
        </tr>
    );
};

const PaymentCalendarTable = ({ calendarData, onDayClick }) => {
    if (!calendarData || !calendarData.calendar_days || calendarData.calendar_days.length === 0) {
        // Adapt the empty state message
        return <p className="text-gray-500 dark:text-gray-400 text-center py-10">Нет данных для отображения за выбранный период.</p>;
    }

    return (
        // 4. Adapt the main container
        <div className="bg-white dark:bg-gray-800 shadow-lg rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700">
            {/* 5. Adapt the header block */}
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
            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                    {/* 6. Adapt the table header */}
                    <thead className="bg-gray-50 dark:bg-gray-700/50">
                        <tr>
                            <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Дата</th>
                            <th scope="col" className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Остаток на начало</th>
                            <th scope="col" className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Поступления</th>
                            <th scope="col" className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Списания</th>
                            <th scope="col" className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Остаток на конец</th>
                        </tr>
                    </thead>
                    {/* The tbody itself does not need dark classes, as its children (tr) handle it */}
                    <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                        {calendarData.calendar_days.map(day => (
                            <CalendarRow key={day.date} dayData={day} onDayClick={onDayClick} />
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default PaymentCalendarTable;