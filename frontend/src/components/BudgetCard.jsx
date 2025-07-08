// frontend/src/components/BudgetCard.jsx

import React from 'react';
// --- ИЗМЕНЕНИЕ: Импортируем иконки из Heroicons ---
import { PencilSquareIcon, TrashIcon } from '@heroicons/react/24/outline'; 
import { useNavigate } from 'react-router-dom';
import { formatCurrency, formatDate } from '../utils/formatting';

// Вспомогательные компоненты не меняются
const BudgetItemRow = ({ item }) => (
  <div className="flex justify-between items-center text-sm py-2 border-b border-gray-200 last:border-b-0">
    <span className="text-gray-600">{item.dds_article?.name || 'Статья не найдена'}</span>
    <span className="font-medium text-gray-800">{formatCurrency(item.budgeted_amount)}</span>
  </div>
);


const BudgetCard = ({ budget, onEdit, onDelete }) => {
  const navigate = useNavigate();

  const totalBudgeted = budget.total_budgeted ?? 'N/A';
  const totalActual = budget.total_actual ?? 'N/A';
  const deviation = budget.total_deviation ?? 'N/A';

  const deviationColor = deviation < 0 ? 'text-red-500' : 'text-green-500';

  const handleCardClick = () => {
    navigate(`/budgets/${budget.id}/status`);
  };

  return (
    <div className="bg-white rounded-xl shadow-md p-6 border border-gray-200 hover:shadow-lg transition-shadow duration-300">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3
            className="text-xl font-bold text-gray-800 cursor-pointer hover:text-blue-600"
            onClick={handleCardClick}
          >
            {budget.name}
          </h3>
          <p className="text-sm font-semibold text-blue-600 bg-blue-50 px-2 py-1 rounded-md inline-block mt-1">
            {formatDate(budget.start_date)} – {formatDate(budget.end_date)}
          </p>
        </div>
        <div className="flex items-center space-x-3">
          {/* --- ИЗМЕНЕНИЕ: Используем компоненты Heroicons --- */}
          <button onClick={() => onEdit(budget)} className="text-gray-500 hover:text-blue-600 transition-colors">
            <PencilSquareIcon className="h-5 w-5" />
          </button>
          <button onClick={() => onDelete(budget)} className="text-gray-500 hover:text-red-600 transition-colors">
            <TrashIcon className="h-5 w-5" />
          </button>
        </div>
      </div>

      <div className="mb-4">
        <h4 className="font-semibold text-gray-700 mb-2">Статьи бюджета:</h4>
        <div className="max-h-48 overflow-y-auto pr-2">
          {budget.budget_items && budget.budget_items.length > 0 ? (
            budget.budget_items.map(item => <BudgetItemRow key={item.id} item={item} />)
          ) : (
            <p className="text-sm text-gray-500">Статьи не добавлены.</p>
          )}
        </div>
      </div>
      
      <div className="border-t-2 border-gray-100 pt-4">
        <div className="flex justify-between items-center mb-2">
          <span className="font-semibold text-gray-600">Запланировано:</span>
          <span className="font-bold text-lg text-gray-800">{formatCurrency(totalBudgeted)}</span>
        </div>
        <div className="flex justify-between items-center mb-2">
          <span className="font-semibold text-gray-600">Фактически:</span>
          <span className="font-bold text-lg text-gray-800">{formatCurrency(totalActual)}</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="font-semibold text-gray-600">Отклонение:</span>
          <span className={`font-bold text-lg ${deviationColor}`}>{formatCurrency(deviation)}</span>
        </div>
      </div>
    </div>
  );
};

export default BudgetCard;