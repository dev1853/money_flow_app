// frontend/src/components/ReportRow.jsx
import React from 'react';

// Функция для форматирования чисел
const formatCurrency = (value) => {
  return (value || 0).toLocaleString('ru-RU', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

const ReportRow = ({ item, level = 0 }) => {
  // Используем `|| 0`, чтобы гарантировать, что мы всегда работаем с числами
  const income = item.income || 0;
  const expense = item.expense || 0;
  const netFlow = income - expense;

  const indentationStyle = { paddingLeft: `${level * 24}px` };
  const isGroup = item.children?.length > 0;
  const textStyle = isGroup ? 'font-bold text-gray-800' : 'font-normal text-gray-700';

  return (
    <>
      <tr className={`border-t border-gray-200 ${isGroup ? 'bg-gray-50' : 'bg-white'}`}>
        <td style={indentationStyle} className={`px-6 py-3 whitespace-nowrap text-sm ${textStyle}`}>
          {item.article_name}
        </td>
        <td className="px-6 py-3 whitespace-nowrap text-sm text-right text-green-600">
          {income > 0 ? formatCurrency(income) : '-'}
        </td>
        <td className="px-6 py-3 whitespace-nowrap text-sm text-right text-red-600">
          {expense > 0 ? formatCurrency(expense) : '-'}
        </td>
        <td className={`px-6 py-3 whitespace-nowrap text-sm text-right font-semibold ${netFlow >= 0 ? 'text-gray-800' : 'text-red-700'}`}>
          {formatCurrency(netFlow)}
        </td>
      </tr>
      {isGroup && item.children?.map(child => (
        <ReportRow key={child.article_id} item={child} level={level + 1} />
      ))}
    </>
  );
};

export default ReportRow;