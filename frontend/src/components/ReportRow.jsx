// frontend/src/components/ReportRow.jsx
import React from 'react';

const ReportRow = ({ item, level = 0, formatCurrency }) => {
  const income = item.income || 0;
  const expense = item.expense || 0;
  const netFlow = income - expense;

  const indentationStyle = { paddingLeft: `${level * 24}px` }; // Для вложенности
  const isGroup = item.children && item.children.length > 0;

  // Базовые классы для ячеек данных
  const baseTdClasses = "whitespace-nowrap px-3 py-4 text-sm";

  return (
    <>
      {/* Классы для строки: фон белый, нижняя граница, и условное выделение для родительских статей */}
      <tr className={`bg-white border-b border-gray-200 ${isGroup ? 'font-semibold text-gray-900' : 'text-gray-500'}`}>
        <td style={indentationStyle} className={`py-4 pl-4 pr-3 text-sm ${isGroup ? 'font-semibold text-gray-900' : 'font-medium text-gray-900'} sm:pl-6`}>
          {isGroup ? item.article_name.toUpperCase() : item.article_name}
        </td>
        <td className={`${baseTdClasses} text-right text-green-600`}>
          {formatCurrency(income)}
        </td>
        <td className={`${baseTdClasses} text-right text-red-600`}>
          {formatCurrency(expense)}
        </td>
        <td className={`${baseTdClasses} text-right ${netFlow >= 0 ? 'text-blue-600' : 'text-purple-600'}`}>
          {formatCurrency(netFlow)}
        </td>
      </tr>
      {isGroup && item.children.map(child => (
        <ReportRow key={child.article_id} item={child} level={level + 1} formatCurrency={formatCurrency} />
      ))}
    </>
  );
};

export default ReportRow;