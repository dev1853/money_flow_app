import React from 'react';
import { formatCurrency } from '../../utils/formatting';
import { ArrowRightIcon } from '@heroicons/react/24/solid';
import { Link } from 'react-router-dom';

const BudgetWidget = ({ budgets, activeWorkspaceCurrency }) => {
  const budget = budgets && budgets.length > 0 ? budgets[0] : null;

  // Адаптируем фон и текст для случая, когда бюджета нет
  if (!budget) {
    return (
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Бюджет</h3>
        <p className="text-gray-500 dark:text-gray-400">Нет активных бюджетов за выбранный период.</p>
        <Link to="/budgets" className="mt-4 inline-flex items-center text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 text-sm font-medium">
          Перейти к бюджетам <ArrowRightIcon className="ml-1 h-4 w-4" />
        </Link>
      </div>
    );
  }

  const totalBudgeted = parseFloat(budget.total_budgeted) || 0;
  const totalActual = parseFloat(budget.total_actual) || 0;
  const deviation = parseFloat(budget.total_deviation) || 0;

  const deviationColor = deviation < 0 ? 'text-red-500 dark:text-red-400' : 'text-green-500 dark:text-green-400';

  return (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">{budget.name}</h3>
        <Link to={`/budgets/${budget.id}/status`} className="text-sm text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300">
          Подробнее <ArrowRightIcon className="inline-block ml-1 h-4 w-4" />
        </Link>
      </div>
      <div className="space-y-3">
        <div className="flex justify-between items-center text-sm">
          <span className="text-gray-600 dark:text-gray-400">Запланировано:</span>
          <span className="font-medium text-gray-800 dark:text-gray-200">{formatCurrency(totalBudgeted, activeWorkspaceCurrency)}</span>
        </div>
        <div className="flex justify-between items-center text-sm">
          <span className="text-gray-600 dark:text-gray-400">Фактически:</span>
          <span className="font-medium text-gray-800 dark:text-gray-200">{formatCurrency(totalActual, activeWorkspaceCurrency)}</span>
        </div>
        <div className="flex justify-between items-center text-sm">
          <span className="text-gray-600 dark:text-gray-400">Отклонение:</span>
          <span className={`font-medium ${deviationColor}`}>
            {formatCurrency(deviation, activeWorkspaceCurrency)}
          </span>
        </div>
      </div>
      {/* Адаптируем прогресс-бар */}
      {totalBudgeted > 0 && (
        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5 mt-4">
          <div
            className="bg-indigo-600 dark:bg-indigo-500 h-2.5 rounded-full"
            style={{ width: `${Math.min(100, (totalActual / totalBudgeted) * 100)}%` }}
          ></div>
        </div>
      )}
    </div>
  );
};

export default BudgetWidget;