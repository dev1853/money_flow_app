// frontend/src/components/DdsStatsCard.jsx
import React from 'react';
import KpiCard from './KpiCard';
import { ArrowTrendingUpIcon, ArrowTrendingDownIcon, ScaleIcon } from '@heroicons/react/24/outline';

const DdsStatsCard = ({ totalIncome, totalExpense, netProfit, currency = '' }) => (
  <div className="grid grid-cols-1 gap-5 sm:grid-cols-3 my-6">
    <KpiCard
      title="Доходы"
      value={`${totalIncome.toFixed(2)} ${currency}`}
      icon={ArrowTrendingUpIcon}
      iconBgColor="bg-green-100 dark:bg-green-900/40"
      iconColor="text-green-500 dark:text-green-400"
      valueColor="text-green-600 dark:text-green-400"
      shadowColorClass="dark:shadow-green-500/10"
    />
    <KpiCard
      title="Расходы"
      value={`${totalExpense.toFixed(2)} ${currency}`}
      icon={ArrowTrendingDownIcon}
      iconBgColor="bg-red-100 dark:bg-red-900/40"
      iconColor="text-red-500 dark:text-red-400"
      valueColor="text-red-600 dark:text-red-400"
      shadowColorClass="dark:shadow-red-500/10"
    />
    <KpiCard
      title="Чистая прибыль"
      value={`${netProfit.toFixed(2)} ${currency}`}
      icon={ScaleIcon}
      iconBgColor={netProfit >= 0 ? "bg-blue-100 dark:bg-blue-900/40" : "bg-purple-100 dark:bg-purple-900/40"}
      iconColor={netProfit >= 0 ? "text-blue-500 dark:text-blue-400" : "text-purple-500 dark:text-purple-400"}
      valueColor={netProfit >= 0 ? "text-blue-600 dark:text-blue-400" : "text-purple-600 dark:text-purple-400"}
      shadowColorClass={netProfit >= 0 ? "dark:shadow-blue-500/10" : "dark:shadow-purple-500/10"}
    />
  </div>
);

export default DdsStatsCard;