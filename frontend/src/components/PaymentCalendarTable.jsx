import React from 'react';
import { formatCurrency, formatDate } from '../utils/formatting';
import { CalendarDaysIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';

const CalendarRow = ({ dayData, onDayClick }) => {
    const endBalanceColor = dayData.balance_end >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400 font-bold';
    const rowClass = dayData.is_cash_gap
        ? 'bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/30 border-l-4 border-red-400 dark:border-red-500 animate-fade-in-up'
        : 'even:bg-gray-50 even:dark:bg-gray-700/50 hover:bg-indigo-50 dark:hover:bg-indigo-900 transition-colors animate-fade-in-up';
    return (
        <tr className={`${rowClass} cursor-pointer`} onClick={() => onDayClick(dayData.date)}>
            <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-800 dark:text-gray-200 flex items-center gap-1">
                {dayData.is_cash_gap && <ExclamationTriangleIcon className="h-4 w-4 text-red-500 mr-1" title="Кассовый разрыв" />}
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

const PaymentCalendarTable = ({ calendarData, onDayClick, fullWidth }) => {
    if (!calendarData || !calendarData.calendar_days || calendarData.calendar_days.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-16">
                <CalendarDaysIcon className="h-12 w-12 text-gray-300 dark:text-gray-600 mb-4" />
                <p className="text-gray-500 dark:text-gray-400 text-center text-lg font-medium">Нет данных для отображения за выбранный период.</p>
            </div>
        );
    }

    return (
        <div className={`bg-white dark:bg-gray-800 shadow-lg rounded-2xl overflow-hidden border border-gray-200 dark:border-gray-700 ${fullWidth ? 'w-full max-w-none' : 'max-w-4xl mx-auto'}`}>
            <div className="flex items-center gap-3 p-6 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50">
                <CalendarDaysIcon className="h-7 w-7 text-indigo-500 dark:text-indigo-400" />
                <h2 className="text-xl font-bold text-gray-900 dark:text-white tracking-tight">Платежный календарь</h2>
                <div className="ml-auto flex flex-col text-right">
                    <span className="text-xs text-gray-500 dark:text-gray-400">Начальный баланс</span>
                    <span className="text-lg font-bold text-gray-800 dark:text-gray-100">{formatCurrency(calendarData.start_balance)}</span>
                </div>
                <div className="flex flex-col text-right ml-6">
                    <span className="text-xs text-gray-500 dark:text-gray-400">Прогноз на конец</span>
                    <span className={`text-lg font-bold ${calendarData.end_balance >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>{formatCurrency(calendarData.end_balance)}</span>
                </div>
            </div>
            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                    <thead className="bg-gray-50 dark:bg-gray-700/50 sticky top-0 z-10">
                        <tr>
                            <th scope="col" className="px-4 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-200 uppercase tracking-wider">Дата</th>
                            <th scope="col" className="px-4 py-3 text-right text-xs font-semibold text-gray-700 dark:text-gray-200 uppercase tracking-wider">Остаток на начало</th>
                            <th scope="col" className="px-4 py-3 text-right text-xs font-semibold text-gray-700 dark:text-gray-200 uppercase tracking-wider">Поступления</th>
                            <th scope="col" className="px-4 py-3 text-right text-xs font-semibold text-gray-700 dark:text-gray-200 uppercase tracking-wider">Списания</th>
                            <th scope="col" className="px-4 py-3 text-right text-xs font-semibold text-gray-700 dark:text-gray-200 uppercase tracking-wider">Остаток на конец</th>
                        </tr>
                    </thead>
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