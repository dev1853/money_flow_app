import React from 'react';

const UniversalTable = ({ columns, data, emptyMessage, footer }) => {
  if (!data || data.length === 0) {
    return <p className="text-center text-gray-500 dark:text-gray-400 py-4">{emptyMessage}</p>;
  }

  return (
    <div className="overflow-x-auto rounded-xl shadow">
      <table className="min-w-full w-full table-auto bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-200 divide-y divide-gray-200 dark:divide-gray-700">
        <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
          <tr>
            {columns.map((column) => (
              <th
                key={column.key}
                scope="col"
                className={`px-6 py-3 text-left font-semibold tracking-wider ${column.className || ''}`}
              >
                {column.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row, rowIndex) => (
            <tr
              key={row.id || rowIndex}
              className="even:bg-gray-50 even:dark:bg-gray-700/50 hover:bg-indigo-50 dark:hover:bg-indigo-900 transition-colors animate-fade-in-up"
            >
              {columns.map((column) => (
                <td
                  key={column.key}
                  className={`px-6 py-3 whitespace-nowrap text-sm ${column.className || ''}`}
                >
                  <span className="text-gray-800 dark:text-gray-200">
                    {column.render ? column.render(row) : row[column.key]}
                  </span>
                </td>
              ))}
            </tr>
          ))}
        </tbody>
        {footer && (
          <tfoot>
            {footer}
          </tfoot>
        )}
      </table>
    </div>
  );
};

export default UniversalTable;