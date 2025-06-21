// frontend/src/components/DdsReportTable.jsx
import React, { useMemo } from 'react';
import ReportRow from '../components/ReportRow';
import { useAuth } from '../contexts/AuthContext';

const DdsReportTable = ({ data }) => {
  const { activeWorkspace } = useAuth();

  const formatCurrency = (value) => {
    return (value || 0).toLocaleString('ru-RU', {
      style: 'currency',
      currency: activeWorkspace?.currency || 'RUB'
    });
  };

  const totals = useMemo(() => {
    let totalIncome = 0;
    let totalExpense = 0;

    data.forEach(item => {
      totalIncome += item.income || 0;
      totalExpense += item.expense || 0;
    });

    const netFlow = totalIncome - totalExpense;
    return { totalIncome, totalExpense, netFlow };
  }, [data]);

  return (
    // Внешний контейнер с отступами и flow-root
    <div className="px-4 sm:px-6 lg:px-8 mt-8 flow-root">
      {/* Контейнер для горизонтальной прокрутки и отрицательных полей */}
      <div className="-mx-4 -my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
        {/* Выравнивающий контейнер и отступы для внутренних элементов таблицы */}
        <div className="inline-block min-w-full py-2 align-middle sm:px-6 lg:px-8">
          {/* Контейнер для тени, скругления углов и скрытия содержимого */}
          <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 sm:rounded-lg">
            <table className="min-w-full divide-y divide-gray-300">
              <thead className="bg-white"> {/* Фон заголовка белый */}
                <tr>
                  <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6">
                    Статья
                  </th>
                  <th scope="col" className="px-3 py-3.5 text-right text-sm font-semibold text-gray-900">
                    Поступления
                  </th>
                  <th scope="col" className="px-3 py-3.5 text-right text-sm font-semibold text-gray-900">
                    Выбытия
                  </th>
                  <th scope="col" className="px-3 py-3.5 text-right text-sm font-semibold text-gray-900">
                    Чистый денежный поток
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white"> {/* Тело таблицы с разделителями и белым фоном */}
                {data.map(item => (
                  <ReportRow key={item.article_id} item={item} formatCurrency={formatCurrency} />
                ))}
              </tbody>
              {/* Футер для итоговых значений, повторяет стили заголовка */}
              <tfoot className="bg-white">
                <tr className="font-semibold text-gray-900"> {/* Bold для итоговой строки */}
                    <td className="py-3.5 pl-4 pr-3 text-left text-sm sm:pl-6">ИТОГО</td>
                    <td className="whitespace-nowrap px-3 py-4 text-right text-sm">{formatCurrency(totals.totalIncome)}</td>
                    <td className="whitespace-nowrap px-3 py-4 text-right text-sm">{formatCurrency(totals.totalExpense)}</td>
                    <td className={`whitespace-nowrap px-3 py-4 text-right text-sm ${totals.netFlow >= 0 ? 'text-blue-600' : 'text-purple-600'}`}>{formatCurrency(totals.netFlow)}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DdsReportTable;