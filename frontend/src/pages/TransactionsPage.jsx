// frontend/src/pages/TransactionsPage.jsx

import React, { useState, useEffect, useCallback, useReducer, Fragment } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { apiService } from '../services/apiService';
import { format, parseISO } from 'date-fns';
import { ru } from 'date-fns/locale';
import { Menu, Transition } from '@headlessui/react';

// Импорт всех UI компонентов
import PageTitle from '../components/PageTitle';
import Button from '../components/Button';
import Loader from '../components/Loader';
import Alert from '../components/Alert';
import EmptyState from '../components/EmptyState';
import Pagination from '../components/Pagination';
import Label from '../components/forms/Label';
import Modal from '../components/Modal';
import TransactionForm from '../components/TransactionForm';
import ConfirmationModal from '../components/ConfirmationModal';
import StatementUploadModal from '../components/StatementUploadModal';
import Select from '../components/forms/Select';
import DateRangePicker from '../components/forms/DateRangePicker';
import { 
  ChevronDownIcon, 
  PlusIcon, 
  FunnelIcon, 
  XMarkIcon, 
  ArrowDownCircleIcon, 
  ArrowUpOnSquareIcon,
  ArrowUpCircleIcon,
  PencilSquareIcon, 
  TrashIcon 
} from '@heroicons/react/24/solid';


const ITEMS_PER_PAGE = 20;

// --- Логика для управления фильтрами (Reducer) ---
const initialFilters = {
  start_date: null,
  end_date: null,
  transaction_type: '',
  account_id: '',
};

function filtersReducer(state, action) {
  switch (action.type) {
    case 'SET_DATE_RANGE':
      return { ...state, start_date: action.payload.startDate, end_date: action.payload.endDate };
    case 'SET_TYPE':
      return { ...state, transaction_type: action.payload };
    case 'SET_ACCOUNT':
      return { ...state, account_id: action.payload };
    case 'RESET_FILTERS':
      return initialFilters;
    default:
      return state;
  }
}


function TransactionsPage() {
  const { activeWorkspace, current_user } = useAuth();
  const [transactionsData, setTransactionsData] = useState({ items: [], total_count: 0 });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState(null);
  const [defaultTransactionType, setDefaultTransactionType] = useState('expense'); // Для кнопки "новая транзакция"
  const [currentFilters, dispatchFilters] = useReducer(filtersReducer, initialFilters);
  const [isUploadModalOpen, setUploadModalOpen] = useState(false);
  const [transactionToDelete, setTransactionToDelete] = useState(null);


  const fetchTransactions = useCallback(async (page, filters) => {
    setLoading(true);
    setError('');
    try {
      if (!activeWorkspace) {
        setError("Рабочее пространство не активно.");
        setLoading(false);
        return;
      }

      const params = new URLSearchParams({
        workspace_id: activeWorkspace.id,
        page: page,
        size: ITEMS_PER_PAGE,
      });

      if (filters.start_date) params.append('start_date', format(filters.start_date, 'yyyy-MM-dd'));
      if (filters.end_date) params.append('end_date', format(filters.end_date, 'yyyy-MM-dd'));
      if (filters.transaction_type) params.append('transaction_type', filters.transaction_type);
      if (filters.account_id) params.append('account_id', filters.account_id);

      const data = await apiService.get(`/transactions/?${params.toString()}`);
      setTransactionsData(data);
    } catch (err) {
      setError(err.message || "Не удалось загрузить транзакции.");
      console.error("Ошибка загрузки транзакций:", err);
    } finally {
      setLoading(false);
    }
  }, [activeWorkspace]);


  // Effect для загрузки транзакций при изменении страницы или фильтров
  useEffect(() => {
    if (activeWorkspace) {
      fetchTransactions(currentPage, currentFilters);
    }
  }, [currentPage, currentFilters, activeWorkspace, fetchTransactions]);

  // Обработчики открытия/закрытия модальных окон
  const handleOpenFormModal = (type = 'expense', transaction = null) => {
    setEditingTransaction(transaction);
    setDefaultTransactionType(type);
    setIsFormModalOpen(true);
  };

  const handleCloseFormModal = useCallback(() => {
    setIsFormModalOpen(false);
    setEditingTransaction(null);
    setDefaultTransactionType('expense'); // Сброс на расход по умолчанию
    fetchTransactions(currentPage, currentFilters); // Обновляем список транзакций
  }, [fetchTransactions, currentPage, currentFilters]);


    const handleTransactionSubmit = useCallback(async (formData) => {
      setLoading(true);
      setError('');
      try {
          let response;
          if (editingTransaction) {
              console.log("DEBUG(TransactionsPage): Submitting PUT request with formData:", JSON.stringify(formData)); // <--- ЛОГ
              console.log("DEBUG(TransactionsPage): Type of formData.date for PUT:", typeof formData.date, "Value:", formData.date); // <--- НОВЫЙ ЛОГ
              response = await apiService.put(`/transactions/${editingTransaction.id}`, formData);
          } else {
              console.log("DEBUG(TransactionsPage): Submitting POST request with formData:", JSON.stringify(formData)); // <--- ЛОГ
              console.log("DEBUG(TransactionsPage): Type of formData.date for POST:", typeof formData.date, "Value:", formData.date); // <--- НОВЫЙ ЛОГ
              response = await apiService.post('/transactions/', formData);
          }
          
          console.log("Транзакция успешно сохранена:", response);
          handleCloseFormModal();

      } catch (err) {
          setError(err.message || "Не удалось сохранить транзакцию.");
          console.error("Ошибка сохранения транзакции:", err);
      } finally {
          setLoading(false);
      }
    }, [editingTransaction, handleCloseFormModal]);

  // Обработчики для фильтров
  const handleDateRangeChange = (startDate, endDate) => {
    dispatchFilters({ type: 'SET_DATE_RANGE', payload: { startDate, endDate } });
    setCurrentPage(1); // Сбросить на первую страницу при изменении фильтров
  };

  const handleTypeFilterChange = (e) => {
    dispatchFilters({ type: 'SET_TYPE', payload: e.target.value });
    setCurrentPage(1);
  };

  const handleAccountFilterChange = (e) => {
    dispatchFilters({ type: 'SET_ACCOUNT', payload: parseInt(e.target.value) || '' });
    setCurrentPage(1);
  };

  const handleResetFilters = () => {
    dispatchFilters({ type: 'RESET_FILTERS' });
    setCurrentPage(1);
  };

  // Удаление транзакций
  const handleDeleteRequest = (transaction) => {
    setTransactionToDelete(transaction);
  };

  const handleDeleteConfirm = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      if (!transactionToDelete) return;
      await apiService.delete(`/transactions/${transactionToDelete.id}`);
      setTransactionToDelete(null); // Сброс транзакции для удаления
      fetchTransactions(currentPage, currentFilters); // Обновляем список
    } catch (err) {
      setError(err.message || "Не удалось удалить транзакцию.");
      console.error("Ошибка удаления транзакции:", err);
    } finally {
      setLoading(false);
    }
  }, [transactionToDelete, fetchTransactions, currentPage, currentFilters]);


  return (
    <Fragment>
      <PageTitle title="Транзакции" />

      {/* Кнопки действий и фильтры */}
      <div className="mb-4 flex justify-between items-center">
        <div className="flex space-x-2">
          <Button onClick={() => handleOpenFormModal('income')} variant="success"><ArrowUpCircleIcon className="h-5 w-5 mr-2"/> Доход</Button>
          <Button onClick={() => handleOpenFormModal('expense')} variant="danger"><ArrowDownCircleIcon className="h-5 w-5 mr-2"/> Расход</Button>
          <Button onClick={() => setUploadModalOpen(true)} variant="secondary"><ArrowUpOnSquareIcon className="h-5 w-5 mr-2"/> Выписка</Button>
        </div>
        <div className="relative">
          <Button onClick={() => {}} variant="outline" className="flex items-center">
            <FunnelIcon className="h-5 w-5 mr-2"/> Фильтры
            <ChevronDownIcon className="-mr-1 h-5 w-5" />
          </Button>
          {/* Здесь будет выпадающее меню фильтров */}
        </div>
      </div>

      {/* Панель фильтров */}
      <div className="bg-white p-4 rounded-xl shadow-sm my-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
          <div>
            <Label htmlFor="dateRange">Период</Label>
            <DateRangePicker
              startDate={currentFilters.start_date}
              endDate={currentFilters.end_date}
              onChange={handleDateRangeChange}
            />
          </div>
          <div>
            <Label htmlFor="transactionType">Тип транзакции</Label>
            <Select
              id="transactionType"
              name="transaction_type"
              value={currentFilters.transaction_type}
              onChange={handleTypeFilterChange}
            >
              <option value="">Все</option>
              <option value="income">Доход</option>
              <option value="expense">Расход</option>
            </Select>
          </div>
          <div>
            <Label htmlFor="accountId">Счет</Label>
            <Select
              id="accountId"
              name="account_id"
              value={currentFilters.account_id}
              onChange={handleAccountFilterChange}
            >
              <option value="">Все</option>
              {/* Тут нужно будет загрузить список счетов */}
              {/* Пока заглушка */}
              <option value="1" >Счет 1</option>
              <option value="2">Счет 2</option>
            </Select>
          </div>
          <Button onClick={handleResetFilters} variant="secondary">Сбросить фильтры</Button>
        </div>
      </div>

      {error && <Alert type="error" className="my-4">{error}</Alert>}
      {loading && <Loader text="Загрузка транзакций..." />}

      {!loading && !error && transactionsData.total_count === 0 && (
        <EmptyState message="Пока нет транзакций по выбранным критериям. Создайте новую!" />
      )}

      {!loading && !error && transactionsData.total_count > 0 && (
        <>
          <div className="bg-white shadow overflow-hidden sm:rounded-lg mt-4">
            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Дата</th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Описание</th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Счет</th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Статья ДДС</th>
                            <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Сумма</th>
                            <th scope="col" className="relative px-6 py-3"><span className="sr-only">Действия</span></th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {transactionsData.items.map(tx => (
                        <tr key={tx.id} className={tx.transaction_type === 'income' ? 'bg-green-50' : 'bg-red-50'}>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{format(parseISO(tx.date), 'dd.MM.yyyy', { locale: ru })}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{tx.description}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{tx.account.name}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{tx.dds_article ? tx.dds_article.name : 'Без статьи'}</td>
                            <td className={`px-6 py-4 whitespace-nowrap text-right text-sm font-medium ${tx.transaction_type === 'income' ? 'text-green-600' : 'text-red-600'}`}>
                                {tx.amount.toLocaleString('ru-RU', { style: 'currency', currency: tx.account.currency })}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                <Button variant="icon" onClick={() => handleOpenFormModal(tx.transaction_type, tx)}><PencilSquareIcon className="h-5 w-5"/></Button>
                                <Button variant="icon" onClick={() => handleDeleteRequest(tx)} className="text-red-600 hover:text-red-800 ml-2"><TrashIcon className="h-5 w-5"/></Button>
                            </td>
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
      
      <Modal isOpen={isFormModalOpen} onClose={handleCloseFormModal} title={editingTransaction ? 'Редактировать транзакцию' : 'Новая транзакция'}>
        <TransactionForm transaction={editingTransaction} defaultType={defaultTransactionType} onSubmit={handleTransactionSubmit} onCancel={handleCloseFormModal}/> {/* <--- ИСПРАВЛЕНО ЗДЕСЬ! */}
      </Modal>
      <StatementUploadModal isOpen={isUploadModalOpen} onClose={() => setUploadModalOpen(false)} onSuccess={() => fetchTransactions(1, initialFilters)} />
      <ConfirmationModal isOpen={Boolean(transactionToDelete)} onClose={() => setTransactionToDelete(null)} onConfirm={handleDeleteConfirm} title="Удалить транзакцию" message={`Вы уверены?`} />
    </Fragment>
  );
}
export default TransactionsPage;