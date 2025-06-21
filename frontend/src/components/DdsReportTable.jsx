// frontend/src/components/DdsReportTable.jsx
import React, { useMemo } from 'react';
import ReportRow from './ReportRow';

const formatCurrency = (value) => {
    return (value || 0).toLocaleString('ru-RU', { style: 'currency', currency: 'RUB' });
};

const DdsReportTable = ({ data }) => {
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
    <div className="bg-white shadow-lg rounded-xl overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full">
          <thead className="bg-gray-100">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">Статья</th>
              <th scope="col" className="px-6 py-3 text-right text-xs font-bold text-gray-600 uppercase tracking-wider">Поступления</th>
              <th scope="col" className="px-6 py-3 text-right text-xs font-bold text-gray-600 uppercase tracking-wider">Выбытия</th>
              <th scope="col" className="px-6 py-3 text-right text-xs font-bold text-gray-600 uppercase tracking-wider">Чистый денежный поток</th>
            </tr>
          </thead>
          <tbody>
            {data.map(item => (
              <ReportRow key={item.article_id} item={item} />
            ))}
          </tbody>
          <tfoot className="bg-gray-100">
            <tr className="font-bold text-gray-900">
                <td className="px-6 py-4 text-left text-sm">ИТОГО</td>
                <td className="px-6 py-4 text-right text-sm">{formatCurrency(totals.totalIncome)}</td>
                <td className="px-6 py-4 text-right text-sm">{formatCurrency(totals.totalExpense)}</td>
                <td className="px-6 py-4 text-right text-sm">{formatCurrency(totals.netFlow)}</td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
};

export default DdsReportTable;