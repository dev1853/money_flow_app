// frontend/src/components/dashboard/ExpensesByCounterpartiesWidget.jsx

import React, { useMemo } from 'react';
import UniversalTable from '../UniversalTable'; // Adjust path if needed
import { formatCurrency } from '../../utils/formatting';

const ExpensesByCounterpartiesWidget = ({ transactions }) => {
  const aggregatedData = useMemo(() => {
    if (!transactions || transactions.length === 0) return [];

    const expensesByCounterparty = {};

    transactions.forEach(transaction => {
      // Агрегируем только расходы
      if (transaction.transaction_type === 'EXPENSE') {
        const counterpartyName = transaction.counterparty?.name || 'Без контрагента';
        const counterpartyId = transaction.counterparty?.id || 'no_counterparty'; // Уникальный ID для контрагента
        const amount = parseFloat(transaction.amount) || 0;

        if (!expensesByCounterparty[counterpartyId]) {
          expensesByCounterparty[counterpartyId] = {
            id: counterpartyId, // Используем ID для ключа React
            name: counterpartyName,
            total_expense: 0,
            currency: transaction.currency || 'RUB', // Берем валюту из первой транзакции
          };
        }
        expensesByCounterparty[counterpartyId].total_expense += amount;
      }
    });

    // Преобразуем объект в массив и форматируем
    return Object.values(expensesByCounterparty).map(item => ({
      ...item,
      total_expense_formatted: formatCurrency(item.total_expense, item.currency),
    })).sort((a, b) => b.total_expense - a.total_expense); // Сортировка по убыванию суммы
  }, [transactions]);

  const columns = useMemo(
    () => [
      { key: 'name', label: 'Контрагент', className: 'flex-grow', accessor: 'name' },
      { key: 'total_expense_formatted', label: 'Сумма', className: 'w-28 text-right', accessor: 'total_expense_formatted' },
    ],
    []
  );

  return (
    <UniversalTable
      columns={columns}
      data={aggregatedData}
      emptyMessage="Нет данных о расходах по контрагентам за выбранный период."
    />
  );
};

export default ExpensesByCounterpartiesWidget;