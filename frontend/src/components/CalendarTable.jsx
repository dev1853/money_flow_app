// frontend/src/components/CalendarTable.jsx

import React from 'react';
import { formatCurrency, formatDate } from '../utils/formatting';

const CalendarRow = ({ dayData }) => {
    // Определяем цвета для положительных и отрицательных значений
    const incomeColor = dayData.income > 0 ? 'text-green-600' : 'text-gray-400';
    const expenseColor = dayData.expense > 0 ? 'text-red-600' : 'text-gray-400';
    const endBalanceColor = dayData.balance_end >= 0 ? 'text-gray-900' : 'text-red-600 font-bold';
    
    // Подсветка всей строки при кассовом разрыве
    const rowClass = dayData.is_cash_gap ? 'bg-red-50' : 'bg-white';

    return (
        <tr className={rowClass}>
            <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-800">
                {formatDate(dayData.date)}
            </td>
            <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600 text-right">
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
        return <p className="text-gray-500">Нет данных для отображения за выбранный период.</p>;
    }

    return (
        <div className="bg-white shadow-lg rounded-lg overflow-hidden border border-gray-200">
            <div className="p-4 border-b">
                <p className="text-sm text-gray-600">Начальный баланс на {formatDate(data.calendar_days[0].date)}</p>
                <p className="text-2xl font-bold text-gray-800">{formatCurrency(data.start_balance)}</p>
            </div>
            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50 sticky top-0">
                        <tr>
                            <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Дата</th>
                            <th scope="col" className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Остаток на начало</th>
                            <th scope="col" className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Поступления</th>
                            <th scope="col" className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Списания</th>
                            <th scope="col" className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Остаток на конец</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {data.calendar_days.map(day => (
                            <CalendarRow key={day.date} dayData={day} />
                        ))}
                    </tbody>
                </table>
            </div>
            <div className="p-4 border-t bg-gray-50">
                <p className="text-sm text-gray-600">Прогнозный баланс на {formatDate(data.calendar_days[data.calendar_days.length - 1].date)}</p>
                <p className={`text-2xl font-bold ${data.end_balance >= 0 ? 'text-gray-800' : 'text-red-600'}`}>
                    {formatCurrency(data.end_balance)}
                </p>
            </div>
        </div>
    );
};

export default CalendarTable;