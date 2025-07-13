// frontend/src/components/dashboard/BudgetWidget.jsx

import React from 'react';
import { formatCurrency } from '../../utils/formatting';
import { ArrowRightIcon } from '@heroicons/react/24/solid';
import { Link } from 'react-router-dom';

const BudgetWidget = ({ budgets, activeWorkspaceCurrency }) => {
  // Для дашборда показываем, например, первый активный бюджет
  const budget = budgets && budgets.length > 0 ? budgets[0] : null;

  if (!budget) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-sm">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Бюджет</h3>
        <p className="text-gray-500">Нет активных бюджетов за выбранный период.</p>
        <Link to="/budgets" className="mt-4 inline-flex items-center text-indigo-600 hover:text-indigo-800 text-sm font-medium">
          Перейти к бюджетам <ArrowRightIcon className="ml-1 h-4 w-4" />
        </Link>
      </div>
    );
  }

  const totalBudgeted = parseFloat(budget.total_budgeted) || 0;
  const totalActual = parseFloat(budget.total_actual) || 0;
  const deviation = parseFloat(budget.total_deviation) || 0;

  const deviationColor = deviation < 0 ? 'text-red-500' : 'text-green-500';

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold text-gray-900">{budget.name}</h3>
        <Link to={`/budgets/${budget.id}/status`} className="text-sm text-indigo-600 hover:text-indigo-800">
          Подробнее <ArrowRightIcon className="inline-block ml-1 h-4 w-4" />
        </Link>
      </div>
      <div className="space-y-3">
        <div className="flex justify-between items-center text-sm">
          <span className="text-gray-600">Запланировано:</span>
          <span className="font-medium text-gray-800">{formatCurrency(totalBudgeted, activeWorkspaceCurrency)}</span>
        </div>
        <div className="flex justify-between items-center text-sm">
          <span className="text-gray-600">Фактически:</span>
          <span className="font-medium text-gray-800">{formatCurrency(totalActual, activeWorkspaceCurrency)}</span>
        </div>
        <div className="flex justify-between items-center text-sm">
          <span className="text-gray-600">Отклонение:</span>
          <span className={`font-medium ${deviationColor}`}>
            {formatCurrency(deviation, activeWorkspaceCurrency)}
          </span>
        </div>
      </div>
      {/* Прогресс бар, если есть */}
      {totalBudgeted > 0 && (
        <div className="w-full bg-gray-200 rounded-full h-2.5 mt-4">
          <div 
            className="bg-indigo-600 h-2.5 rounded-full" 
            style={{ width: `${Math.min(100, (totalActual / totalBudgeted) * 100)}%` }}
          ></div>
        </div>
      )}
    </div>
  );
};

export default BudgetWidget;