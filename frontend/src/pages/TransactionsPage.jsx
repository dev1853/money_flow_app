// frontend/src/pages/TransactionsPage.jsx

import React, { useState, useEffect, useCallback, useReducer, useMemo, Fragment } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { apiService } from '../services/apiService';
import { format, parseISO, endOfMonth, startOfMonth } from 'date-fns'; 
import { ru } from 'date-fns/locale';
import { Menu, Transition } from '@headlessui/react';

// Импорт всех UI компонентов
import PageTitle from '../components/PageTitle';
import Button from '../components/Button';
import Loader from '../components/Loader';
import Alert from '../components/Alert';
import EmptyState from '../components/EmptyState';
import Pagination from '../components/Pagination';
import Modal from '../components/Modal';
import TransactionForm from '../components/TransactionForm';
import ConfirmationModal from '../components/ConfirmationModal';
import StatementUploadModal from '../components/StatementUploadModal'; 
import Select from '../components/forms/Select';
import DateRangePicker from '../components/forms/DateRangePicker'; 
import Label from '../components/forms/Label'; 

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
      const { startDate: currentQStart, endDate: currentQEnd } = getCurrentQuarterDates();
      return { ...initialFilters, start_date: currentQStart, end_date: currentQEnd };
    default:
      return state;
  }
}

// Вспомогательная функция для получения начала и конца текущего квартала
const getCurrentQuarterDates = () => {
  const now = new Date();
  const currentMonth = now.getMonth(); 
  const currentYear = now.getFullYear();

  let quarterStartMonth;
  if (currentMonth >= 0 && currentMonth <= 2) { 
    quarterStartMonth = 0;
  } else if (currentMonth >= 3 && currentMonth <= 5) { 
    quarterStartMonth = 3;
  } else if (currentMonth >= 6 && currentMonth <= 8) { 
    quarterStartMonth = 6;
  } else { 
    quarterStartMonth = 9;
  }

  const startDate = new Date(currentYear, quarterStartMonth, 1);
  const endDate = endOfMonth(new Date(currentYear, quarterStartMonth + 2)); 

  return { startDate, endDate };
};


function TransactionsPage() {
  const { activeWorkspace } = useAuth();
  const [transactionsData, setTransactionsData] = useState({ items: [], total_count: 0 });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState(null);
  const [defaultTransactionType, setDefaultTransactionType] = useState('expense'); 
  const [currentFilters, dispatchFilters] = useReducer(filtersReducer, initialFilters); 
  const [isUploadModalOpen, setUploadModalOpen] = useState(false);
  const [transactionToDelete, setTransactionToDelete] = useState(null);

  const [accounts, setAccounts] = useState([]); 
  const [ddsArticles, setDdsArticles] = useState([]); 
  
  useEffect(() => {
    const { startDate: currentQStart, endDate: currentQEnd } = getCurrentQuarterDates();
    dispatchFilters({ type: 'SET_DATE_RANGE', payload: { startDate: currentQStart, endDate: currentQEnd } });
  }, []); 


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


  useEffect(() => {
    if (activeWorkspace && currentFilters.start_date && currentFilters.end_date) { 
      fetchTransactions(currentPage, currentFilters);
    }
  }, [currentPage, currentFilters, activeWorkspace, fetchTransactions]);


  useEffect(() => {
    const fetchSelectData = async () => {
      if (!activeWorkspace || !activeWorkspace.id) return;
      try {
        const fetchedAccounts = await apiService.get(`/accounts/?workspace_id=${activeWorkspace.id}`);
        setAccounts(fetchedAccounts || []);

        const fetchedDdsArticles = await apiService.get(`/dds-articles/?workspace_id=${activeWorkspace.id}`);
        setDdsArticles(fetchedDdsArticles || []);

      } catch (err) {
        console.error("Ошибка загрузки данных для фильтров:", err);
      }
    };
    if (activeWorkspace) {
      fetchSelectData();
    }
  }, [activeWorkspace]);


  const handleOpenFormModal = (type = 'expense', transaction = null) => {
    setEditingTransaction(transaction);
    setDefaultTransactionType(type);
    setIsFormModalOpen(true);
  };

  const handleCloseFormModal = useCallback(() => {
    setIsFormModalOpen(false);
    setEditingTransaction(null);
    setDefaultTransactionType('expense'); 
    fetchTransactions(currentPage, currentFilters); 
  }, [fetchTransactions, currentPage, currentFilters]);


  const handleTransactionSubmit = useCallback(async (formData) => {
    setLoading(true); 
    setError(''); 
    try {
        let response;
        if (editingTransaction) {
            response = await apiService.put(`/transactions/${editingTransaction.id}`, formData);
        } else {
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


  const handleDateRangeChange = (startDate, endDate) => {
    dispatchFilters({ type: 'SET_DATE_RANGE', payload: { startDate, endDate } });
    setCurrentPage(1); 
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

  const handleDeleteRequest = (transaction) => {
    setTransactionToDelete(transaction);
  };

  const handleConfirmDelete = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      if (!transactionToDelete) return;
      await apiService.delete(`/transactions/${transactionToDelete.id}`);
      fetchTransactions(currentPage, currentFilters); 
      setTransactionToDelete(null); 
    } catch (err) {
      setError(err.message || "Не удалось удалить транзакцию.");
      console.error("Ошибка удаления транзакции:", err);
    } finally {
      setLoading(false);
    }
  }, [transactionToDelete, fetchTransactions, currentPage, currentFilters]);

  // Опции для select счетов
  const accountOptions = useMemo(() => {
    return accounts.map(acc => ({ value: acc.id, label: `${acc.name} (${acc.currency})` }));
  }, [accounts]);


  return (
    <React.Fragment>
      {/* ИЗМЕНЕНО: Объединенный блок заголовка и фильтров */}
      <div className="px-4 sm:px-6 lg:px-8 py-6">
        <div className="sm:flex sm:items-center sm:flex-wrap sm:justify-between"> 
          <div className="sm:flex-auto sm:min-w-0"> 
            <PageTitle title="Транзакции" className="mb-6 sm:mb-0" />
          </div>
          
          {/* Правый блок с кнопками действий и компактными фильтрами */}
          <div className="mt-4 w-full sm:w-auto sm:mt-0 sm:ml-auto sm:flex-none"> 
            {/* ИЗМЕНЕНО: уменьшен padding до p-2 */}
            <div className="bg-white p-2 rounded-xl shadow-sm"> {/* <--- ИЗМЕНЕНО: p-2 вместо p-3 */}
                {/* Кнопки действий */}
                <div className="flex space-x-2 mb-3 justify-end"> {/* <--- ИЗМЕНЕНО: mb-3 вместо mb-4 */}
                    <Button onClick={() => handleOpenFormModal('income')} variant="success"><ArrowUpCircleIcon className="h-5 w-5 mr-2"/> Доход</Button>
                    <Button onClick={() => handleOpenFormModal('expense')} variant="danger"><ArrowDownCircleIcon className="h-5 w-5 mr-2"/> Расход</Button>
                    <Button onClick={() => setUploadModalOpen(true)} variant="secondary"><ArrowUpOnSquareIcon className="h-5 w-5 mr-2"/> Выписка</Button>
                </div>
                {/* Фильтры */}
                <div className="sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-x-2 gap-y-2 items-end"> {/* <--- ИЗМЕНЕНО */}
                    <div>
                        <DateRangePicker
                            startDate={currentFilters.start_date}
                            endDate={currentFilters.end_date}
                            onChange={handleDateRangeChange}
                            placeholder="Период" // <--- НОВЫЙ ПРОПС, если DateRangePicker его поддерживает
                        />
                    </div>
                    <div>
                        <Select
                            id="transactionType"
                            name="transaction_type"
                            value={currentFilters.transaction_type}
                            onChange={handleTypeFilterChange}
                        >
                            <option value="">Тип</option> {/* <--- Изменен текст опции */}
                            <option value="income">Доход</option>
                            <option value="expense">Расход</option>
                        </Select>
                    </div>
                    <div>
                        {/* ИЗМЕНЕНО: Удален Label */}
                        <Select
                            id="accountId"
                            name="account_id"
                            value={currentFilters.account_id}
                            onChange={handleAccountFilterChange}
                        >
                            <option value="">Счет</option>
                            {accountOptions.map(option => (
                                <option key={option.value} value={option.value}>{option.label}</option>
                            ))}
                        </Select>
                    </div>
                    <div> 
                        <Button onClick={handleResetFilters} variant="primary" className="w-full">Сбросить</Button> {/* <--- Добавлен w-full */}
                    </div>
                </div>
            </div>
          </div>
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
        <TransactionForm transaction={editingTransaction} defaultType={defaultTransactionType} onSubmit={handleTransactionSubmit} onCancel={handleCloseFormModal} ddsArticles={ddsArticles} />
      </Modal>
      <StatementUploadModal isOpen={isUploadModalOpen} onClose={() => setUploadModalOpen(false)} onSuccess={() => fetchTransactions(1, initialFilters)} />
      <ConfirmationModal isOpen={Boolean(transactionToDelete)} onClose={() => setTransactionToDelete(null)} onConfirm={handleConfirmDelete} title="Удалить транзакцию" message={`Выверены?`} />
    </React.Fragment>
  );
}


export default TransactionsPage;