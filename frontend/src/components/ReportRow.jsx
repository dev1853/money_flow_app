// frontend/src/components/ReportRow.jsx
import React from 'react';

const ReportRow = ({ item, level = 0, columns, formatCurrency, baseTdClasses, firstColTdClasses, onArticleClick }) => { // ДОБАВЛЕН onArticleClick
  const income = item.income || 0;
  const expense = item.expense || 0;
  const netFlow = income - expense;

  const indentationStyle = { paddingLeft: `${level * 24}px` };
  const isGroup = item.children && item.children.length > 0;
  
  return (
    <>
      <tr className={`border-b border-gray-200 odd:bg-white even:bg-gray-50 ${isGroup ? 'font-semibold text-gray-900' : 'text-gray-500 hover:bg-gray-100'}`}>
        {columns.map((column, colIndex) => {
          let cellContent;
          let currentCellClasses = baseTdClasses; 
          let cellStyle = {}; 

          if (colIndex === 0) {
            cellContent = isGroup ? item.article_name.toUpperCase() : item.article_name;
            cellStyle = indentationStyle;
            currentCellClasses += ` ${isGroup ? 'font-semibold text-gray-900' : 'font-medium text-gray-900'} pl-4 sm:pl-6`;
            
            // НОВОЕ: Делаем название статьи кликабельным, если это не группа
            if (!isGroup && onArticleClick) {
                cellContent = (
                    <span 
                        className="text-indigo-600 hover:text-indigo-900 cursor-pointer" 
                        onClick={() => onArticleClick(item.article_id, item.article_name, item.type)} // Передаем ID, имя, тип
                    >
                        {item.article_name}
                    </span>
                );
            } else if (isGroup) {
                cellContent = item.article_name.toUpperCase();
            } else {
                cellContent = item.article_name;
            }
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
            cellContent = column.render(item);
            currentCellClasses += ` ${column.align ? `text-${column.align}` : 'text-left'}`;
            if (column.type === 'currency' || column.type === 'number') {
                currentCellClasses += ' text-right';
            }
          } else {
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
          baseTdClasses={baseTdClasses} 
          firstColTdClasses={firstColTdClasses}
          onArticleClick={onArticleClick} // <--- ПЕРЕДАЕМ ДАЛЬШЕ
        />
      ))}
    </>
  );
};

export default ReportRow;