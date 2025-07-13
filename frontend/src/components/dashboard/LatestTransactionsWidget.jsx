// frontend/src/components/dashboard/LatestTransactionsWidget.jsx

import React, { useMemo } from 'react';
import UniversalTable from '../UniversalTable'; // Adjust path if needed
import { format, parseISO, isValid } from 'date-fns';
import { formatCurrency } from '../../utils/formatting';
import { ArrowUpCircleIcon, ArrowDownCircleIcon } from '@heroicons/react/24/solid';

const LatestTransactionsWidget = ({ transactions }) => {
  const columns = useMemo(
    () => [
      {
        key: 'status',
        label: '',
        className: 'w-12 text-center',
        render: (row) => {
          const isIncome = row.transaction_type === 'INCOME';
          const StatusIcon = isIncome ? ArrowUpCircleIcon : ArrowDownCircleIcon;
          const amountColor = isIncome ? 'text-green-600' : 'text-red-600';
          return <StatusIcon className={`h-5 w-5 mx-auto ${amountColor}`} />;
        },
      },
      {
        key: 'date',
        label: 'Дата',
        className: 'w-24',
        render: (row) =>
          row.transaction_date && isValid(parseISO(row.transaction_date))
            ? format(parseISO(row.transaction_date), 'dd.MM.yyyy')
            : 'Н/Д',
      },
      {
        key: 'description',
        label: 'Описание',
        className: 'flex-grow',
        accessor: 'description',
      },
      {
        key: 'amount',
        label: 'Сумма',
        className: 'w-28 text-right',
        render: (row) => {
          const isIncome = row.transaction_type === 'INCOME';
          const amountPrefix = isIncome ? '+' : '-';
          const amountColor = isIncome ? 'text-green-600' : 'text-red-600';
          return (
            <span className={`font-medium ${amountColor}`}>
              {amountPrefix} {formatCurrency(row.amount, row.currency)}
            </span>
          );
        },
      },
      {
        key: 'account',
        label: 'Счет',
        className: 'w-32',
        render: (row) => row.from_account?.name || row.to_account?.name || 'Н/Д',
      },
      {
        key: 'dds_article',
        label: 'Статья ДДС',
        className: 'w-48',
        render: (row) => row.dds_article?.name || 'Без статьи',
      },
    ],
    []
  );

  return (
    <UniversalTable
      columns={columns}
      data={transactions}
      emptyMessage="Нет последних транзакций за выбранный период."
    />
  );
};

export default LatestTransactionsWidget;