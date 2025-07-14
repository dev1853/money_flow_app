import React from 'react';

const ReportRow = ({ item, level = 0, columns, formatCurrency, baseTdClasses, firstColTdClasses, onArticleClick }) => {
  const income = item.income || 0;
  const expense = item.expense || 0;
  const netFlow = income - expense;

  const indentationStyle = { paddingLeft: `${level * 24}px` };
  const isGroup = item.children && item.children.length > 0;
  
  return (
    <>
      {/* 1. Adapt row background, text and border colors */}
      <tr className={`border-b border-gray-200 dark:border-gray-700 ${
        isGroup 
          ? 'font-semibold text-gray-900 dark:text-gray-100 bg-gray-50 dark:bg-gray-700/50' 
          : 'text-gray-500 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700/40'
      }`}>
        {columns.map((column, colIndex) => {
          let cellContent;
          let currentCellClasses = baseTdClasses; 
          let cellStyle = {}; 

          if (colIndex === 0) {
            cellStyle = indentationStyle;
            currentCellClasses += ` ${isGroup ? 'font-semibold text-gray-900 dark:text-gray-100' : 'font-medium text-gray-800 dark:text-gray-200'} pl-4 sm:pl-6`;
            
            if (!isGroup && onArticleClick) {
              cellContent = (
                  // 2. Adapt clickable link color
                  <span 
                    className="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300 cursor-pointer" 
                    onClick={() => onArticleClick(item.article_id, item.article_name, item.type)}
                  >
                    {item.article_name}
                  </span>
              );
            } else {
              cellContent = isGroup ? item.article_name.toUpperCase() : item.article_name;
            }
          } else if (column.accessor === 'income') {
            cellContent = formatCurrency(income);
            // 3. Adapt income text color
            currentCellClasses += ` text-right text-green-600 dark:text-green-400`;
          } else if (column.accessor === 'expense') {
            cellContent = formatCurrency(expense);
            // 4. Adapt expense text color
            currentCellClasses += ` text-right text-red-600 dark:text-red-400`;
          } else if (column.accessor === 'net_flow') {
            cellContent = formatCurrency(netFlow);
            // 5. Adapt net flow text color
            currentCellClasses += ` text-right ${netFlow >= 0 ? 'text-blue-600 dark:text-blue-400' : 'text-purple-600 dark:text-purple-400'}`;
          } else {
            // This handles any other generic columns
            cellContent = column.render ? column.render(item) : String(item[column.accessor]);
            currentCellClasses += ` ${column.align ? `text-${column.align}` : 'text-left'}`;
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
          onArticleClick={onArticleClick}
        />
      ))}
    </>
  );
};

export default ReportRow;