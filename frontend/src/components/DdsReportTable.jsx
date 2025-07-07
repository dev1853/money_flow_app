// frontend/src/components/DdsReportTable.jsx
import React, { useMemo } from 'react';
import { useAuth } from '../contexts/AuthContext';
import UniversalTable from './UniversalTable';
import ReportRow from './ReportRow';

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

  // ИСПРАВЛЕНО: Добавлено логирование для проверки входящих данных
  console.log("DEBUG(DdsReportTable): data received:", data);


  const headers = [
    {
      key: 'article_name',
      label: 'Группа статей / Статья ДДС',
      rowspan: 2,
      className: 'text-left w-1/3',
      render: (row) => {
        // ИСПРАВЛЕНО: Добавлено логирование для каждой строки
        console.log("DEBUG(DdsReportTable): Rendering row:", row);
        return (
          <span
            className={`cursor-pointer text-blue-600 hover:text-blue-800`}
            onClick={() => onArticleClick(row.article_id, row.article_name, row.article_type)}
          >
            {row.article_name}
          </span>
        );
      },
    },
    {
      key: 'initial_balance',
      label: 'Входящее сальдо',
      rowspan: 2,
      className: 'text-right',
      render: (row) => formatCurrency(row.initial_balance),
    },
    {
      label: 'Оборот за период',
      colspan: 2,
      className: 'text-center',
      children: [
        {
          key: 'inflows',
          label: 'Поступления',
          className: 'text-right',
          render: (row) => (row.article_type === 'income' ? formatCurrency(row.turnover) : ''),
        },
        {
          key: 'outflows',
          label: 'Выбытия',
          className: 'text-right',
          render: (row) => (row.article_type === 'expense' ? formatCurrency(Math.abs(row.turnover)) : ''),
        },
      ],
    },
    {
      key: 'final_balance',
      label: 'Исходящее сальдо',
      rowspan: 2,
      className: 'text-right',
      render: (row) => formatCurrency(row.final_balance),
    },
    {
      key: 'percentage_of_total',
      label: '% от оборота',
      rowspan: 2,
      className: 'text-right',
      render: (row) => `${parseFloat(row.percentage_of_total).toFixed(2)}%`,
    },
  ];

  const tableFooter = (
    <tr className="font-bold text-gray-900 bg-white border-t border-gray-200">
      <td className="py-3.5 pl-4 pr-3 text-left text-sm sm:pl-6">ИТОГО</td>
      <td className="whitespace-nowrap px-3 py-4 text-right text-sm">{formatCurrency(totals.totalInitialBalance)}</td>
      <td className="whitespace-nowrap px-3 py-4 text-right text-sm">{formatCurrency(totals.totalIncome)}</td>
      <td className="whitespace-nowrap px-3 py-4 text-right text-sm">{formatCurrency(totals.totalExpense)}</td>
      <td className="whitespace-nowrap px-3 py-4 text-right text-sm">{formatCurrency(totals.totalFinalBalance)}</td>
      <td className="whitespace-nowrap px-3 py-4 text-right text-sm"></td>
    </tr>
  );

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm mt-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Отчет о движении денежных средств (ДДС)</h3>
      <UniversalTable
        data={Array.isArray(data) ? data : []}
        headers={headers}
        emptyMessage="Нет данных для выбранного периода."
        footer={tableFooter}
      />
    </div>
  );
};

export default DdsReportTable;