// frontend/src/pages/BudgetStatusPage.jsx

import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { useDataFetching } from '../hooks/useDataFetching';
import { apiService } from '../services/apiService';
// Добавляем импорт formatDate для красивых дат
import { formatCurrency, formatDate } from '../utils/formatting';

// Компоненты
import PageTitle from '../components/PageTitle';
import Loader from '../components/Loader';
import Alert from '../components/Alert';
import Button from '../components/Button';
import { ArrowLeftIcon } from '@heroicons/react/24/solid';

// УЛУЧШЕНИЕ: Компонент для визуального индикатора выполнения
const ProgressBar = ({ actual, budgeted }) => {
    // Гарантируем, что работаем с числами
    const actualAmount = parseFloat(actual) || 0;
    const budgetedAmount = parseFloat(budgeted) || 1; // Избегаем деления на ноль
    
    // Рассчитываем процент, но не позволяем ему быть > 100% для визуала
    const percentage = Math.min((actualAmount / budgetedAmount) * 100, 100);

    let barColor = 'bg-green-500 dark:bg-green-600';
    if (percentage > 80) barColor = 'bg-yellow-500 dark:bg-yellow-500';
    if (percentage >= 100) barColor = 'bg-red-500 dark:bg-red-600';

    return (
        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
            <div className={`${barColor} h-2.5 rounded-full`} style={{ width: `${percentage}%` }}></div>
        </div>
    );
};

function BudgetStatusPage() {
    const { budgetId } = useParams();

    // Этот хук теперь должен получать правильные данные от бэкенда
    const { data: budgetStatus, isLoading, error: fetchError } = useDataFetching(
        () => budgetId ? apiService.getBudgetStatus(budgetId) : Promise.resolve(null),
        [budgetId]
    );

    if (isLoading) {
        return <Loader text="Загрузка статуса бюджета..." />;
    }

    if (fetchError) {
        return (
            <Alert type="error" className="mb-4">
                Ошибка загрузки статуса бюджета: {fetchError.message || 'Произошла непредвиденная ошибка.'}
            </Alert>
        );
    }

    if (!budgetStatus) {
        return (
            <Alert type="info" className="mb-4">
                Статус бюджета не найден. Проверьте ID бюджета.
            </Alert>
        );
    }

    const {
        budget_name,
        start_date,
        end_date,
        total_budgeted,
        total_actual,
        total_deviation,
        items_status
    } = budgetStatus;

    return (
        <div className="dark:text-gray-200">
            <div className="flex justify-between items-center mb-6">
                <PageTitle title={`Статус бюджета: ${budget_name}`} />
                <Link to="/budgets">
                    <Button variant="secondary" iconLeft={<ArrowLeftIcon className="h-5 w-5" />}>
                        К списку бюджетов
                    </Button>
                </Link>
            </div>

            {/* Общий обзор бюджета */}
            <div className="bg-white dark:bg-gray-800 shadow-md rounded-lg p-6 mb-8 border border-gray-200 dark:border-gray-700">
                <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-100 mb-4">Общий обзор</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Период:</p>
                        <p className="text-md font-medium text-gray-800 dark:text-gray-200">{formatDate(start_date)} - {formatDate(end_date)}</p>
                    </div>
                    <div>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Запланировано:</p>
                        <p className="text-lg font-bold text-indigo-600 dark:text-indigo-400">{formatCurrency(total_budgeted)}</p>
                    </div>
                    <div>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Отклонение:</p>
                        <p className={`text-lg font-bold ${total_deviation >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                            {formatCurrency(total_deviation)}
                        </p>
                    </div>
                </div>
                 <div className="mt-4">
                    <p className="text-sm text-gray-500 dark:text-gray-400">Фактически израсходовано:</p>
                    <p className="text-2xl font-extrabold text-gray-800 dark:text-gray-100">{formatCurrency(total_actual)}</p>
                </div>
            </div>

            {/* Детализация по статьям */}
            <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-100 mb-4">Детализация по статьям</h2>
            <div className="bg-white dark:bg-gray-800 shadow-md rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                    {/* Адаптируем заголовок таблицы */}
                    <thead className="bg-gray-50 dark:bg-gray-700/50">
                        <tr>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Статья</th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Выполнение</th>
                            <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Факт / План</th>
                            <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Отклонение</th>
                        </tr>
                    </thead>
                    {/* Адаптируем тело таблицы */}
                    <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                        {items_status.map((item) => (
                            <tr key={item.article_id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-gray-100">{item.article_name}</td>
                                <td className="px-6 py-4 whitespace-nowrap"><ProgressBar actual={item.actual_amount} budgeted={item.budgeted_amount} /></td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-600 dark:text-gray-300">
                                    {formatCurrency(item.actual_amount)} / <span className="text-gray-500 dark:text-gray-400">{formatCurrency(item.budgeted_amount)}</span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-right">
                                    <span className={`font-semibold ${item.deviation >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                                        {formatCurrency(item.deviation)}
                                    </span>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

export default BudgetStatusPage;