import React, { useMemo } from 'react';
import { useAuth } from '../contexts/AuthContext';
import UniversalTable from './UniversalTable';

// ReportRow logic is now integrated into the headers config, so it's not a separate component.

const DdsReportTable = ({ data, onArticleClick }) => {
  const { activeWorkspace } = useAuth();

  const formatCurrency = (value) => {
    return (value || 0).toLocaleString('ru-RU', {
      style: 'currency',
      currency: activeWorkspace?.currency || 'RUB'
    });
  };

  const totals = useMemo(() => {
    // ... (calculation logic remains the same)
    let totalIncome = 0;
    let totalExpense = 0;
    let netFlow = 0;

    if (data && data.length > 0) {
        data.forEach(item => {
            if (item.article_type === 'income') {
                totalIncome += parseFloat(item.turnover) || 0;
            } else if (item.article_type === 'expense') {
                totalExpense += Math.abs(parseFloat(item.turnover)) || 0;
            }
            netFlow += parseFloat(item.turnover) || 0;
        });
    }
    const totalInitialBalance = 0;
    const totalFinalBalance = 0;
    return { totalIncome, totalExpense, netFlow, totalInitialBalance, totalFinalBalance };
  }, [data]);


  const columns = [
    {
      key: 'article_name',
      label: 'Группа статей / Статья ДДС',
      rowspan: 2,
      className: 'text-left w-1/3 border-r border-gray-200 dark:border-gray-700',
      render: (row) => (
        <span
          className={`cursor-pointer text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300`}
          onClick={() => onArticleClick(row.article_id, row.article_name, row.article_type)}
        >
          {row.article_name}
        </span>
      ),
    },
    {
      key: 'initial_balance',
      label: 'Входящее сальдо',
      rowspan: 2,
      className: 'text-right border-r border-gray-200 dark:border-gray-700',
      render: (row) => formatCurrency(row.initial_balance),
    },
    {
      label: 'Оборот за период',
      colspan: 2,
      className: 'text-center border-r border-gray-200 dark:border-gray-700',
      children: [
        {
          key: 'inflows',
          label: 'Поступления',
          className: 'text-right',
          render: (row) => (row.article_type === 'income' ? <span className="text-green-600 dark:text-green-400">{formatCurrency(row.turnover)}</span> : ''),
        },
        {
          key: 'outflows',
          label: 'Выбытия',
          className: 'text-right',
          render: (row) => (row.article_type === 'expense' ? <span className="text-red-600 dark:text-red-400">{formatCurrency(Math.abs(row.turnover))}</span> : ''),
        },
      ],
    },
    { key: 'final_balance', label: 'Исходящее сальдо', rowspan: 2, className: 'text-right border-r border-gray-200 dark:border-gray-700', render: (row) => formatCurrency(row.final_balance) },
    { key: 'percentage_of_total', label: '% от оборота', rowspan: 2, className: 'text-right', render: (row) => `${parseFloat(row.percentage_of_total).toFixed(2)}%` },
  ];

  // 4. Adapt the table footer
  const tableFooter = (
    <tr className="font-bold text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700">
      <td className="py-3.5 pl-4 pr-3 text-left text-sm sm:pl-6">ИТОГО</td>
      <td className="whitespace-nowrap px-3 py-4 text-right text-sm">{formatCurrency(totals.totalInitialBalance)}</td>
      <td className="whitespace-nowrap px-3 py-4 text-right text-sm text-green-600 dark:text-green-400">{formatCurrency(totals.totalIncome)}</td>
      <td className="whitespace-nowrap px-3 py-4 text-right text-sm text-red-600 dark:text-red-400">{formatCurrency(totals.totalExpense)}</td>
      <td className="whitespace-nowrap px-3 py-4 text-right text-sm">{formatCurrency(totals.totalFinalBalance)}</td>
      <td className="whitespace-nowrap px-3 py-4 text-right text-sm"></td>
    </tr>
  );

  return (
    // 5. Adapt the main component container
    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm mt-6 border border-gray-200 dark:border-gray-700">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Отчет о движении денежных средств (ДДС)</h3>
      {/* UniversalTable will use our custom headers and footer */}
      <UniversalTable
        data={Array.isArray(data) ? data : []}
        
        columns={columns}
        emptyMessage="Нет данных для выбранного периода."
        footer={tableFooter}
      />
    </div>
  );
};

export default DdsReportTable;