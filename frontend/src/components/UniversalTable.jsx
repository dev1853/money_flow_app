// frontend/src/components/UniversalTable.jsx
import React from 'react';

// Универсальный компонент таблицы
const UniversalTable = ({ data, columns, emptyMessage = "Нет данных для отображения.", RowComponent = null, footer = null }) => {
  if (!data || data.length === 0) {
    return (
      <div className="mt-6 text-center text-gray-500">
        <p>{emptyMessage}</p>
      </div>
    );
  }

  // Базовые классы для ячеек данных (стандартный вид)
  // Это общие стили, которые будут дополняться или переопределяться
  // в render-функциях колонок или в RowComponent
  const baseTdClasses = "whitespace-nowrap px-3 py-4 text-sm";
  const firstColTdClasses = "font-medium text-gray-900 pl-4 sm:pl-6";

  return (
    <div className="mt-6 flow-root">
      <div className="-mx-4 -my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
        <div className="inline-block min-w-full py-2 align-middle sm:px-6 lg:px-8">
          <div className="overflow-hidden shadow sm:rounded-lg">
            <table className="min-w-full divide-y divide-gray-300">
              <thead className="bg-white">
                <tr>
                  {columns.map((column, index) => (
                    <th
                      key={column.accessor || index}
                      scope="col"
                      // Заголовки колонок
                      className={`py-3.5 px-3 text-sm font-semibold text-gray-900 ${
                        column.align === 'right' ? 'text-right pr-4' : 'text-left pl-4'
                      } ${index === 0 ? 'sm:pl-6' : ''}`}
                    >
                      {column.header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white">
                {data.map((row, rowIndex) => (
                  RowComponent ? (
                    // Если передан RowComponent, он отвечает за всю строку и её ячейки.
                    // Он должен сам применить стили odd/even и базовые td классы.
                    <RowComponent 
                      key={row.id || rowIndex} 
                      item={row} 
                      columns={columns} 
                      baseTdClasses={baseTdClasses} // Передаем базовые классы для использования в ReportRow
                      firstColTdClasses={firstColTdClasses} // И для первой колонки
                      // ... (другие пропсы, например, formatCurrency, передаются из DdsReportTable)
                    />
                  ) : (
                    // Стандартный рендер строки для плоских данных
                    <tr key={row.id || rowIndex} className="odd:bg-white even:bg-gray-50 hover:bg-gray-100"> 
                      {columns.map((column, colIndex) => (
                        <td
                          key={column.accessor ? `${row.id}-${column.accessor}` : `${rowIndex}-${colIndex}`}
                          className={`${baseTdClasses} ${
                            column.align === 'right' ? 'text-right' : 'text-left'
                          } ${colIndex === 0 ? firstColTdClasses : 'text-gray-500'}`}
                        >
                          {/* Используем render-функцию колонки, если она есть, иначе по accessor */}
                          {column.render ? column.render(row) : String(row[column.accessor])}
                        </td>
                      ))}
                    </tr>
                  )
                ))}
              </tbody>
              {footer && (
                <tfoot className="bg-white">
                  {footer}
                </tfoot>
              )}
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UniversalTable;