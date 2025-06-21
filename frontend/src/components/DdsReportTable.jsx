// frontend/src/components/DdsReportTable.jsx
import React, { useMemo } from 'react';
import ReportRow from './ReportRow';
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
    <div className="mt-6 flow-root">
      <div className="-mx-4 -my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
        <div className="inline-block min-w-full py-2 align-middle sm:px-6 lg:px-8">
          <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 sm:rounded-lg">
            <table className="min-w-full divide-y divide-gray-300">
              {/* ИЗМЕНЕНО: bg-white для заголовка */}
              <thead className="bg-white">
                <tr>
                  <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6">
                    Статья
                  </th>
                  <th scope="col" className="px-3 py-3.5 text-right text-sm font-semibold text-gray-900">
                    Поступления
                  </th>
                  <th scope="col" className="px-3 py-3.5 text-right text-sm font-semibold text-gray-900">
                    Расходы
                  </th>
                  <th scope="col" className="px-3 py-3.5 text-right text-sm font-semibold text-gray-900">
                    Чистый денежный поток
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white">
                {data.map(item => (
                  <ReportRow key={item.article_id} item={item} formatCurrency={formatCurrency} />
                ))}
              </tbody>
              {/* ИЗМЕНЕНО: bg-white для футера */}
              <tfoot className="bg-white">
                <tr className="font-bold text-gray-900">
                    <td className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6">ИТОГО</td>
                    <td className="whitespace-nowrap px-3 py-4 text-right text-sm text-gray-900">{formatCurrency(totals.totalIncome)}</td>
                    <td className="whitespace-nowrap px-3 py-4 text-right text-sm text-gray-900">{formatCurrency(totals.totalExpense)}</td>
                    <td className={`whitespace-nowrap px-3 py-4 text-right text-sm ${totals.netFlow >= 0 ? 'text-green-600' : 'text-red-600'}`}>{formatCurrency(totals.netFlow)}</td>
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