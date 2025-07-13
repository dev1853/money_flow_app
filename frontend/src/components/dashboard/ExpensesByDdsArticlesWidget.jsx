// frontend/src/components/dashboard/ExpensesByDdsArticlesWidget.jsx

import React, { useMemo } from 'react';
import UniversalTable from '../UniversalTable'; // Adjust path if needed
import { formatCurrency } from '../../utils/formatting';

const ExpensesByDdsArticlesWidget = ({ ddsReport }) => {
  // Предполагаем, что ddsReport.items уже содержит агрегированные данные
  // в формате { name: "Название статьи", total_expense: 123.45 }
  const tableData = useMemo(() => {
    return (ddsReport?.items || []).map(item => ({
      ...item,
      // Убедитесь, что здесь есть 'id' для ключа таблицы, если DDS Report не возвращает id для агрегации
      id: item.id || item.name, // Используем id или имя как ключ, если id нет
      article_name: item.name, // Название статьи ДДС
      total_expense_formatted: formatCurrency(item.total_expense, ddsReport.currency),
    }));
  }, [ddsReport]);

  const columns = useMemo(
    () => [
      { key: 'article_name', label: 'Статья', className: 'flex-grow', accessor: 'article_name' },
      { key: 'total_expense_formatted', label: 'Сумма', className: 'w-28 text-right', accessor: 'total_expense_formatted' },
    ],
    []
  );

  return (
    <UniversalTable
      columns={columns}
      data={tableData}
      emptyMessage="Нет данных о расходах по статьям за выбранный период."
    />
  );
};

export default ExpensesByDdsArticlesWidget;