// frontend/src/components/ReportRow.jsx
import React from 'react';

// ДОБАВЛЕНО: baseTdClasses и firstColTdClasses как пропсы
const ReportRow = ({ item, level = 0, columns, formatCurrency, baseTdClasses, firstColTdClasses }) => { 
  const income = item.income || 0;
  const expense = item.expense || 0;
  const netFlow = income - expense;

  const indentationStyle = { paddingLeft: `${level * 24}px` };
  const isGroup = item.children && item.children.length > 0;
  
  return (
    <>
      {/* ИЗМЕНЕНО: Базовые классы для строки и чередования цветов */}
      <tr className={`border-b border-gray-200 odd:bg-white even:bg-gray-50 ${isGroup ? 'font-semibold text-gray-900' : 'text-gray-500 hover:bg-gray-100'}`}>
        {columns.map((column, colIndex) => {
          let cellContent;
          let currentCellClasses = baseTdClasses; // Начинаем с базовых классов
          let cellStyle = {}; 

          if (colIndex === 0) {
            // Первая колонка - название статьи
            cellContent = isGroup ? item.article_name.toUpperCase() : item.article_name;
            cellStyle = indentationStyle;
            currentCellClasses += ` ${firstColTdClasses}`; // Добавляем стили для первой колонки
          } else if (column.accessor === 'income') {
            cellContent = formatCurrency(income);
            currentCellClasses += ` text-right text-green-600`;
          } else if (column.accessor === 'expense') {
            cellContent = formatCurrency(expense);
            currentCellClasses += ` text-right text-red-600`;
          } else if (column.accessor === 'net_flow') {
            cellContent = formatCurrency(netFlow);
            currentCellClasses += ` text-right ${netFlow >= 0 ? 'text-blue-600' : 'text-purple-600'}`;
          } else if (column.render) {
            // Если для колонки есть пользовательский рендер
            cellContent = column.render(item);
            currentCellClasses += ` ${column.align ? `text-${column.align}` : 'text-left'}`;
            if (column.type === 'currency' || column.type === 'number') {
                currentCellClasses += ' text-right';
            }
          } else {
            // По умолчанию - отображаем значение по accessor
            cellContent = String(item[column.accessor]);
            currentCellClasses += ` ${column.align ? `text-${column.align}` : 'text-left'}`;
            if (column.type === 'currency' || column.type === 'number') {
                currentCellClasses += ' text-right';
            }
          }

          return (
            <td 
              key={`${item.id}-${column.accessor || colIndex}`} 
              className={currentCellClasses}
              style={cellStyle}
            >
              {cellContent}
            </td>
          );
        })}
      </tr>
      {isGroup && item.children.map(child => (
        <ReportRow 
          key={child.article_id} 
          item={child} 
          level={level + 1} 
          columns={columns} 
          formatCurrency={formatCurrency} 
          baseTdClasses={baseTdClasses} // Передаем базовые классы дальше
          firstColTdClasses={firstColTdClasses} // Передаем базовые классы дальше
        />
      ))}
    </>
  );
};

export default ReportRow;