// frontend/src/components/DdsStatsCard.jsx
import React from 'react';
// Импортируем иконки
import { ArrowTrendingUpIcon, ArrowTrendingDownIcon, ScaleIcon } from '@heroicons/react/24/outline'; 

const DdsStatsCard = ({ totalIncome, totalExpense, netProfit, currency = '' }) => {
  return (
    <div className="grid grid-cols-1 gap-5 sm:grid-cols-3 my-6">
      {/* Карточка Доходов */}
      <div className="relative overflow-hidden rounded-lg bg-white px-4 py-5 pb-12 shadow transition-shadow duration-300 hover:shadow-lg"> {/* Добавлен hover:shadow-lg и pb-12 */}
        <dt className="truncate text-sm font-medium text-gray-500">Доходы</dt>
        <dd className="mt-1 text-3xl font-semibold tracking-tight text-green-600">
          {totalIncome.toFixed(2)} {currency}
        </dd>
        {/* Иконка в углу */}
        <div className="absolute bottom-0 right-0 p-3 bg-green-100 rounded-tl-lg"> {/* Фон для иконки */}
          <ArrowTrendingUpIcon className="h-6 w-6 text-green-500" aria-hidden="true" />
        </div>
      </div>
      
      {/* Карточка Расходов */}
      <div className="relative overflow-hidden rounded-lg bg-white px-4 py-5 pb-12 shadow transition-shadow duration-300 hover:shadow-lg">
        <dt className="truncate text-sm font-medium text-gray-500">Расходы</dt>
        <dd className="mt-1 text-3xl font-semibold tracking-tight text-red-600">
          {totalExpense.toFixed(2)} {currency}
        </dd>
        {/* Иконка в углу */}
        <div className="absolute bottom-0 right-0 p-3 bg-red-100 rounded-tl-lg">
          <ArrowTrendingDownIcon className="h-6 w-6 text-red-500" aria-hidden="true" />
        </div>
      </div>

      {/* Карточка Чистой прибыли */}
      <div className="relative overflow-hidden rounded-lg bg-white px-4 py-5 pb-12 shadow transition-shadow duration-300 hover:shadow-lg">
        <dt className="truncate text-sm font-medium text-gray-500">Чистая прибыль</dt>
        <dd 
          className={`mt-1 text-3xl font-semibold tracking-tight ${
            netProfit >= 0 ? 'text-blue-600' : 'text-purple-600'
          }`}
        >
          {netProfit.toFixed(2)} {currency}
        </dd>
        {/* Иконка в углу */}
        <div className="absolute bottom-0 right-0 p-3 bg-blue-100 rounded-tl-lg"> {/* Для прибыли можно синий фон */}
          <ScaleIcon className="h-6 w-6 text-blue-500" aria-hidden="true" />
        </div>
      </div>
    </div>
  );
};

export default DdsStatsCard;