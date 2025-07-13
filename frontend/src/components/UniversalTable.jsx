// frontend/src/components/UniversalTable.jsx

import React from 'react';
import Alert from './Alert';
import Loader from './Loader';
import EmptyState from './EmptyState';

function UniversalTable({ columns, data, loading, emptyMessage = "Нет данных для отображения.", footer }) {
  if (loading) {
    return <Loader />;
  }

  if (!columns || !Array.isArray(columns)) {
    console.error("UniversalTable: `columns` prop is required and must be an array.");
    return <Alert type="error">Ошибка конфигурации таблицы: отсутствуют заголовки.</Alert>;
  }

  if (!data || data.length === 0) {
    return <EmptyState message={emptyMessage} />;
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            {columns.map(column => (
              <th
                key={column.accessor || column.header || column.key} // Добавлено column.key для надежности
                className={`px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider ${column.className || ''}`}
              >
                {column.label || column.header} {/* Отображаем label или header */}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {data.map(row => (
            <tr key={row.id}> {/* Предполагаем, что у каждого элемента данных есть уникальный 'id' */}
              {columns.map(column => (
                <td 
                  key={`${row.id}-${column.accessor || column.key || column.label}`} // Улучшенный ключ для ячеек
                  className={`px-6 py-4 whitespace-nowrap text-sm ${column.className && column.className.includes('text-right') ? 'text-right' : 'text-left'} ${column.className || ''}`}
                >
                  {/* ИСПРАВЛЕНО: Добавлен try-catch блок для отладки ошибок рендеринга ячеек */}
                  {(() => {
                    try {
                      const cellContent = column.render ? column.render(row) : row[column.accessor];
                      // Логируем содержимое ячейки перед возвратом
                      // console.log(`UniversalTable: Cell [${column.key || column.label}] for row ID ${row.id}:`, cellContent);
                      return cellContent;
                    } catch (err) {
                      console.error(`UniversalTable Error: Ошибка рендеринга для столбца '${column.label || column.key}' в строке ID ${row.id}. Данные строки:`, row, `Ошибка:`, err);
                      return <span className="text-red-500">Ошибка</span>; // Возвращаем сообщение об ошибке в ячейке
                    }
                  })()}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
        {footer && (
          <tfoot className="bg-gray-50 border-t-2 border-gray-200">
            {footer}
          </tfoot>
        )}
      </table>
    </div>
  );
}

export default UniversalTable;