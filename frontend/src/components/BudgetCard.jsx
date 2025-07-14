import React from 'react';
import { PencilSquareIcon, TrashIcon } from '@heroicons/react/24/solid';
import Button from './Button';
import { useNavigate } from 'react-router-dom';
import { formatCurrency, formatDate } from '../utils/formatting';

// 1. Adapt the sub-component for budget items
const BudgetItemRow = ({ item }) => (
  <div className="flex justify-between items-center text-sm py-2 border-b border-gray-200 dark:border-gray-700 last:border-b-0">
    <span className="text-gray-600 dark:text-gray-400">{item.dds_article?.name || 'Статья не найдена'}</span>
    <span className="font-medium text-gray-800 dark:text-gray-200">{formatCurrency(item.budgeted_amount)}</span>
  </div>
);

const BudgetCard = ({ budget, onEdit, onDelete }) => {
  const navigate = useNavigate();

  const totalBudgeted = budget.total_budgeted ?? 'N/A';
  const totalActual = budget.total_actual ?? 'N/A';
  const deviation = budget.total_deviation ?? 'N/A';

  // 2. Adapt the dynamic color for the deviation amount
  const deviationColor = deviation < 0 
    ? 'text-red-500 dark:text-red-400' 
    : 'text-green-500 dark:text-green-400';

  const handleCardClick = (e) => {
    // Prevent navigation when clicking on a button
    if (e.target.closest('button')) {
      e.stopPropagation();
      return;
    }
    navigate(`/budgets/${budget.id}/status`);
  };

  return (
    // 3. Adapt the main card container
    <div 
      className="bg-white dark:bg-gray-800 rounded-xl shadow-md dark:shadow-2xl dark:shadow-indigo-500/10 p-6 border border-gray-200 dark:border-gray-700 hover:shadow-lg transition-shadow duration-300 cursor-pointer"
      onClick={handleCardClick}
    >
      <div className="flex justify-between items-start mb-4">
        <div className="flex-grow">
          {/* 4. Adapt titles and text */}
          <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100 hover:text-indigo-600 dark:hover:text-indigo-400">
            {budget.name}
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {formatDate(budget.start_date)} - {formatDate(budget.end_date)}
          </p>
        </div>
        <div className="flex space-x-2 ml-4">
          {/* Buttons should already be adapted */}
          <Button variant="icon" title="Редактировать" onClick={() => onEdit(budget)}>
            <PencilSquareIcon className="h-5 w-5" />
          </Button>
          <Button variant="icon" title="Удалить" onClick={() => onDelete(budget)} className="text-gray-500 hover:text-red-600 dark:text-gray-400 dark:hover:text-red-500">
            <TrashIcon className="h-5 w-5" />
          </Button>
        </div>
      </div>

      <div className="mb-4">
        <h4 className="font-semibold text-gray-700 dark:text-gray-300 mb-2">Статьи бюджета:</h4>
        <div className="max-h-48 overflow-y-auto pr-2">
          {budget.budget_items && budget.budget_items.length > 0 ? (
            budget.budget_items.map(item => <BudgetItemRow key={item.id} item={item} />)
          ) : (
            <p className="text-sm text-gray-500 dark:text-gray-400">Статьи не добавлены.</p>
          )}
        </div>
      </div>
      
      {/* 5. Adapt the final summary section */}
      <div className="border-t-2 border-gray-100 dark:border-gray-700 pt-4">
        <div className="flex justify-between items-center mb-2">
          <span className="font-semibold text-gray-600 dark:text-gray-400">Запланировано:</span>
          <span className="font-bold text-lg text-gray-800 dark:text-gray-200">{formatCurrency(totalBudgeted)}</span>
        </div>
        <div className="flex justify-between items-center mb-2">
          <span className="font-semibold text-gray-600 dark:text-gray-400">Фактически:</span>
          <span className="font-bold text-lg text-gray-800 dark:text-gray-200">{formatCurrency(totalActual)}</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="font-semibold text-gray-600 dark:text-gray-400">Отклонение:</span>
          <span className={`font-bold text-lg ${deviationColor}`}>
            {formatCurrency(deviation)}
          </span>
        </div>
      </div>
    </div>
  );
};

export default BudgetCard;