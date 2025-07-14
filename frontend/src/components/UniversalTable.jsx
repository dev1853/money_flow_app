import React from 'react';

const UniversalTable = ({ columns, data, emptyMessage }) => {
  // Проверяем, есть ли данные для отображения
  if (!data || data.length === 0) {
    // Адаптируем сообщение для пустой таблицы
    return <p className="text-center text-gray-500 dark:text-gray-400 py-4">{emptyMessage}</p>;
  }

  return (
    <div className="overflow-x-auto">
      {/* Адаптируем цвет разделителей в таблице */}
      <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
        {/* Адаптируем фон заголовка таблицы */}
        <thead className="bg-gray-50 dark:bg-gray-700/50">
          <tr>
            {columns.map((column) => (
              <th
                key={column.key}
                scope="col"
                // Адаптируем цвет текста заголовка
                className={`px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider ${column.className || ''}`}
              >
                {column.label}
              </th>
            ))}
          </tr>
        </thead>
        {/* Адаптируем фон и разделители тела таблицы */}
        <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
          {data.map((row, rowIndex) => (
            // Адаптируем цвет строки при наведении
            <tr key={row.id || rowIndex} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
              {columns.map((column) => (
                <td
                  key={column.key}
                  // Адаптируем цвет текста в ячейках
                  className={`px-6 py-4 whitespace-nowrap text-sm ${column.className || ''}`}
                >
                  {/* Цвет текста для обычных ячеек */}
                  <span className="text-gray-800 dark:text-gray-200">
                    {column.render ? column.render(row) : row[column.accessor]}
                  </span>
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default UniversalTable;