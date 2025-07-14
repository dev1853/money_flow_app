// frontend/src/components/DdsStatsCard.jsx
import React from 'react';
import { ArrowTrendingUpIcon, ArrowTrendingDownIcon, ScaleIcon } from '@heroicons/react/24/outline'; 

const DdsStatsCard = ({ totalIncome, totalExpense, netProfit, currency = '' }) => {
  return (
    <div className="grid grid-cols-1 gap-5 sm:grid-cols-3 my-6">
      
      {/* Карточка Доходов */}
      <div className="relative overflow-hidden rounded-lg bg-white dark:bg-gray-800 px-4 py-5 shadow-md dark:shadow-2xl dark:shadow-green-500/10 transition-shadow duration-300 hover:shadow-lg border border-gray-200 dark:border-gray-700">
        <dt className="truncate text-sm font-medium text-gray-500 dark:text-gray-400">Доходы</dt>
        <dd className="mt-1 text-3xl font-semibold tracking-tight text-green-600 dark:text-green-400">
          {totalIncome.toFixed(2)} {currency}
        </dd>
        <div className="absolute bottom-0 right-0 p-3 bg-green-100 dark:bg-green-900/40 rounded-tl-lg">
          <ArrowTrendingUpIcon className="h-6 w-6 text-green-500 dark:text-green-400" aria-hidden="true" />
        </div>
      </div>
      
      {/* Карточка Расходов */}
      <div className="relative overflow-hidden rounded-lg bg-white dark:bg-gray-800 px-4 py-5 shadow-md dark:shadow-2xl dark:shadow-red-500/10 transition-shadow duration-300 hover:shadow-lg border border-gray-200 dark:border-gray-700">
        <dt className="truncate text-sm font-medium text-gray-500 dark:text-gray-400">Расходы</dt>
        <dd className="mt-1 text-3xl font-semibold tracking-tight text-red-600 dark:text-red-400">
          {totalExpense.toFixed(2)} {currency}
        </dd>
        <div className="absolute bottom-0 right-0 p-3 bg-red-100 dark:bg-red-900/40 rounded-tl-lg">
          <ArrowTrendingDownIcon className="h-6 w-6 text-red-500 dark:text-red-400" aria-hidden="true" />
        </div>
      </div>

      {/* Карточка Чистой прибыли */}
      <div className="relative overflow-hidden rounded-lg bg-white dark:bg-gray-800 px-4 py-5 shadow-md dark:shadow-2xl dark:shadow-blue-500/10 transition-shadow duration-300 hover:shadow-lg border border-gray-200 dark:border-gray-700">
        <dt className="truncate text-sm font-medium text-gray-500 dark:text-gray-400">Чистая прибыль</dt>
        <dd 
          className={`mt-1 text-3xl font-semibold tracking-tight ${
            netProfit >= 0 ? 'text-blue-600 dark:text-blue-400' : 'text-purple-600 dark:text-purple-400'
          }`}
        >
          {netProfit.toFixed(2)} {currency}
        </dd>
        <div className={`absolute bottom-0 right-0 p-3 rounded-tl-lg ${netProfit >= 0 ? 'bg-blue-100 dark:bg-blue-900/40' : 'bg-purple-100 dark:bg-purple-900/40'}`}>
          <ScaleIcon className={`h-6 w-6 ${netProfit >= 0 ? 'text-blue-500 dark:text-blue-400' : 'text-purple-500 dark:text-purple-400'}`} aria-hidden="true" />
        </div>
      </div>
    </div>
  );
};

export default DdsStatsCard;