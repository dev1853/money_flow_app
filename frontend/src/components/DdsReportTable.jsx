// frontend/src/components/DdsReportTable.jsx
import React, { useMemo } from 'react';
import { useAuth } from '../contexts/AuthContext';
import UniversalTable from './UniversalTable'; 
import ReportRow from './ReportRow'; 

// ДОБАВЛЕН onArticleClick в пропсы DdsReportTable
const DdsReportTable = ({ data, onArticleClick }) => { 
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
    
    if (data && data.length > 0) {
        data.forEach(item => {
            totalIncome += item.income || 0;
            totalExpense += item.expense || 0;
        });
    }

    const netFlow = totalIncome - totalExpense;
    return { totalIncome, totalExpense, netFlow };
  }, [data]);

  const columns = [
    { header: 'Статья', accessor: 'article_name', align: 'left', type: 'text' },
    { header: 'Поступления', accessor: 'income', align: 'right', type: 'currency' },
    { header: 'Выбытия', accessor: 'expense', align: 'right', type: 'currency' },
    { header: 'Чистый БизнесПоток', accessor: 'net_flow', align: 'right', type: 'currency' },
  ];

  const tableFooter = (
    <tr className="font-bold text-gray-900 bg-white border-t border-gray-200">
        <td className="py-3.5 pl-4 pr-3 text-left text-sm sm:pl-6">ИТОГО</td>
        <td className="whitespace-nowrap px-3 py-4 text-right text-sm">{formatCurrency(totals.totalIncome)}</td>
        <td className="whitespace-nowrap px-3 py-4 text-right text-sm">{formatCurrency(totals.totalExpense)}</td>
        <td className={`whitespace-nowrap px-3 py-4 text-right text-sm ${totals.netFlow >= 0 ? 'text-blue-600' : 'text-purple-600'}`}>{formatCurrency(totals.netFlow)}</td>
    </tr>
  );

  return (
    <UniversalTable 
      data={data} 
      columns={columns} 
      emptyMessage="Нет данных для выбранного периода." 
      RowComponent={(props) => (
        <ReportRow 
          {...props} 
          formatCurrency={formatCurrency} 
          onArticleClick={onArticleClick} // <--- ПЕРЕДАЕМ onArticleClick
        />
      )} 
      footer={tableFooter} 
    />
  );
};

export default DdsReportTable;