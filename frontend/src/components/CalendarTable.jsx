import React from 'react';
import { formatCurrency, formatDate } from '../utils/formatting';

// 1. Adapt the CalendarRow sub-component
const CalendarRow = ({ dayData }) => {
    // 2. Add dark mode variants to dynamic colors
    const incomeColor = dayData.income > 0 ? 'text-green-600 dark:text-green-400' : 'text-gray-400 dark:text-gray-500';
    const expenseColor = dayData.expense > 0 ? 'text-red-600 dark:text-red-400' : 'text-gray-400 dark:text-gray-500';
    const endBalanceColor = dayData.balance_end >= 0 ? 'text-gray-900 dark:text-gray-100' : 'text-red-600 dark:text-red-400 font-bold';
    
    // 3. Adapt the row background for cash gaps and hover states
    const rowClass = dayData.is_cash_gap 
        ? 'bg-red-50 dark:bg-red-900/20' 
        : 'bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700/50';

    return (
        <tr className={`${rowClass} transition-colors`}>
            {/* Adapt text colors in cells */}
            <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-800 dark:text-gray-200">
                {formatDate(dayData.date)}
            </td>
            <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400 text-right">
                {formatCurrency(dayData.balance_start)}
            </td>
            <td className={`px-4 py-3 whitespace-nowrap text-sm text-right font-medium ${incomeColor}`}>
                +{formatCurrency(dayData.income)}
            </td>
            <td className={`px-4 py-3 whitespace-nowrap text-sm text-right font-medium ${expenseColor}`}>
                -{formatCurrency(dayData.expense)}
            </td>
            <td className={`px-4 py-3 whitespace-nowrap text-sm text-right font-semibold ${endBalanceColor}`}>
                {formatCurrency(dayData.balance_end)}
            </td>
        </tr>
    );
};


const CalendarTable = ({ data }) => {
    if (!data || !data.calendar_days || data.calendar_days.length === 0) {
        // Adapt the empty state message
        return <p className="text-gray-500 dark:text-gray-400">Нет данных для отображения за выбранный период.</p>;
    }

    return (
        // 4. Adapt the main container
        <div className="bg-white dark:bg-gray-800 shadow-lg rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700">
            {/* 5. Adapt the header block */}
            <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                <p className="text-sm text-gray-600 dark:text-gray-400">Начальный баланс на {formatDate(data.calendar_days[0].date)}</p>
                <p className="text-2xl font-bold text-gray-800 dark:text-gray-100">{formatCurrency(data.start_balance)}</p>
            </div>
            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                    {/* 6. Adapt the table header */}
                    <thead className="bg-gray-50 dark:bg-gray-700/50 sticky top-0">
                        <tr>
                            <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Дата</th>
                            <th scope="col" className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Остаток на начало</th>
                            <th scope="col" className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Поступления</th>
                            <th scope="col" className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Списания</th>
                            <th scope="col" className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Остаток на конец</th>
                        </tr>
                    </thead>
                    {/* The tbody itself does not need dark classes, as its children (tr) handle it */}
                    <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                        {data.calendar_days.map(day => (
                            <CalendarRow key={day.date} dayData={day} />
                        ))}
                    </tbody>
                </table>
            </div>
            {/* 7. Adapt the footer block */}
            <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50">
                <p className="text-sm text-gray-600 dark:text-gray-400">Прогнозный баланс на {formatDate(data.calendar_days[data.calendar_days.length - 1].date)}</p>
                <p className={`text-2xl font-bold ${data.end_balance >= 0 ? 'text-gray-800 dark:text-gray-100' : 'text-red-600 dark:text-red-400'}`}>
                    {formatCurrency(data.end_balance)}
                </p>
            </div>
        </div>
    );
};

export default CalendarTable;