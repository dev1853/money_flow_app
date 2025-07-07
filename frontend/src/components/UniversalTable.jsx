// frontend/src/components/UniversalTable.jsx

import React from 'react';
import Alert from './Alert';
import Loader from './Loader';
import EmptyState from './EmptyState';

function UniversalTable({ headers, data, loading, emptyMessage = "Нет данных для отображения.", footer }) {
  if (loading) {
    return <Loader />;
  }

  if (!headers || !Array.isArray(headers)) {
    console.error("UniversalTable: `headers` prop is required and must be an array.");
    return <Alert type="error">Ошибка конфигурации таблицы: отсутствуют заголовки.</Alert>;
  }

  if (!data || data.length === 0) { // Убедимся, что data - массив и не пуст
    return <EmptyState message={emptyMessage} />;
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            {headers.map(header => (
              <th
                key={header.key}
                className={`px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider ${header.className || ''}`}
              >
                {header.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {data.map(row => (
            <tr key={row.id}>
              {headers.map(header => (
                <td key={`${row.id}-${header.key}`} className={`px-6 py-4 whitespace-nowrap text-sm ${header.className && header.className.includes('text-right') ? 'text-right' : 'text-left'} ${header.className || ''}`}>
                  {header.render ? header.render(row) : row[header.key]}
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