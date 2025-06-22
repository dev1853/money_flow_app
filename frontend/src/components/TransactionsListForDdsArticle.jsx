// frontend/src/components/TransactionsListForDdsArticle.jsx
import React, { useState, useEffect } from 'react';
import { apiService } from '../services/apiService';
import { useAuth } from '../contexts/AuthContext';
import { format, parseISO } from 'date-fns';
import { ru } from 'date-fns/locale';

// Импорт компонентов
import Loader from './Loader';
import Alert from './Alert';
import EmptyState from './EmptyState';
import Pagination from './Pagination';
import Button from './Button'; // Для кнопок внутри таблицы, если нужны
import { PencilSquareIcon, TrashIcon } from '@heroicons/react/24/solid'; // Для иконок

const ITEMS_PER_PAGE = 10; // Меньше элементов в модальном окне

const TransactionsListForDdsArticle = ({ articleId, articleName, startDate, endDate, onClose }) => {
  const { activeWorkspace } = useAuth();
  const [transactionsData, setTransactionsData] = useState({ items: [], total_count: 0 });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  const fetchTransactions = async (page) => {
    setLoading(true);
    setError('');
    try {
      if (!activeWorkspace || !articleId || !startDate || !endDate) {
        setError("Недостаточно данных для загрузки транзакций.");
        setLoading(false);
        return;
      }

      const params = new URLSearchParams({
        workspace_id: activeWorkspace.id,
        page: page,
        size: ITEMS_PER_PAGE,
        dds_article_id: articleId, // Фильтр по ID статьи ДДС
        start_date: format(startDate, 'yyyy-MM-dd'),
        end_date: format(endDate, 'yyyy-MM-dd'),
      });

      const requestUrl = `/transactions/?${params.toString()}`; // <--- НОВЫЙ ЛОГ
      console.log("DEBUG(Drilldown): Fetching transactions with URL:", requestUrl); // <--- НОВЫЙ ЛОГ
      console.log("DEBUG(Drilldown): articleId:", articleId, "startDate:", startDate, "endDate:", endDate); // <--- НОВЫЙ ЛОГ

      const data = await apiService.get(requestUrl); // Используем requestUrl
      setTransactionsData(data);
    } catch (err) {
      setError(err.message || "Не удалось загрузить транзакции.");
      console.error("DEBUG(Drilldown): Ошибка загрузки транзакций для статьи:", err); // <--- НОВЫЙ ЛОГ
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTransactions(currentPage);
  }, [currentPage, articleId, startDate, endDate, activeWorkspace]);

  return (
    <div className="p-4">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Транзакции для статьи: "{articleName}"</h3>
      <p className="text-sm text-gray-600 mb-4">
        Период: {format(startDate, 'dd.MM.yyyy', { locale: ru })} - {format(endDate, 'dd.MM.yyyy', { locale: ru })}
      </p>

      {error && <Alert type="error" className="my-4">{error}</Alert>}
      {loading && <Loader text="Загрузка транзакций..." />}

      {!loading && !error && transactionsData.total_count === 0 && (
        <EmptyState message="Нет транзакций для этой статьи в указанный период." />
      )}

      {!loading && !error && transactionsData.total_count > 0 && (
        <>
          <div className="bg-white shadow overflow-hidden sm:rounded-lg">
            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Дата</th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Описание</th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Счет</th>
                            <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Сумма</th>
                            {/* <th scope="col" className="relative px-6 py-3"><span className="sr-only">Действия</span></th> */}
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {transactionsData.items.map(tx => (
                        <tr key={tx.id} className={tx.transaction_type === 'income' ? 'bg-green-50' : 'bg-red-50'}>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{format(parseISO(tx.date), 'dd.MM.yyyy', { locale: ru })}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{tx.description}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{tx.account.name}</td>
                            <td className={`px-6 py-4 whitespace-nowrap text-right text-sm font-medium ${tx.transaction_type === 'income' ? 'text-green-600' : 'text-red-600'}`}>
                                {tx.amount.toLocaleString('ru-RU', { style: 'currency', currency: tx.account.currency })}
                            </td>
                            {/* Действия пока не нужны в детальном отчете */}
                            {/* <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                <Button variant="icon"><PencilSquareIcon className="h-5 w-5"/></Button>
                                <Button variant="icon" className="text-red-600 hover:text-red-800 ml-2"><TrashIcon className="h-5 w-5"/></Button>
                            </td> */}
                        </tr>
                        ))}
                    </tbody>
                </table>
            </div>
          </div>
          <Pagination
            currentPage={currentPage}
            totalPages={Math.ceil(transactionsData.total_count / ITEMS_PER_PAGE)}
            onPageChange={setCurrentPage}
          />
        </>
      )}
      <div className="flex justify-end mt-4">
        <Button onClick={onClose} variant="secondary">Закрыть</Button>
      </div>
    </div>
  );
};

export default TransactionsListForDdsArticle;