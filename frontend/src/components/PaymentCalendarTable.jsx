// /frontend/src/components/PaymentCalendarTable.jsx

import React from 'react';
import { formatCurrency, formatDate } from '../utils/formatting';

const CalendarRow = ({ dayData, onDayClick }) => {
    const endBalanceColor = dayData.balance_end >= 0 ? 'text-gray-900' : 'text-red-600 font-bold';
    const rowClass = dayData.is_cash_gap 
        ? 'bg-red-50 hover:bg-red-100 cursor-pointer' 
        : 'hover:bg-gray-50 cursor-pointer';

    return (
        <tr className={rowClass} onClick={() => onDayClick(dayData.date)}>
            <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-800">
                {formatDate(new Date(dayData.date + 'T00:00:00'))}
            </td>
            <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600 text-right">
                {formatCurrency(dayData.balance_start)}
            </td>
            <td className="px-4 py-3 whitespace-nowrap text-sm text-right font-medium text-green-600">
                {dayData.income > 0 ? `+${formatCurrency(dayData.income)}` : '—'}
            </td>
            <td className="px-4 py-3 whitespace-nowrap text-sm text-right font-medium text-red-600">
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
        return <p className="text-gray-500 text-center py-10">Нет данных для отображения за выбранный период.</p>;
    }

    return (
        <div className="bg-white shadow-lg rounded-lg overflow-hidden border border-gray-200">
            {/* ... (Шапка с балансами, как и раньше) ... */}
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
            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Дата</th>
                            <th scope="col" className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Остаток на начало</th>
                            <th scope="col" className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Поступления</th>
                            <th scope="col" className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Списания</th>
                            <th scope="col" className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Остаток на конец</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
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