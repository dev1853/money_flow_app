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
    case 'SET_FILTER':
      // Обновляет одно поле фильтра
      return { ...state, [action.field]: action.payload };
    case 'RESET':
      // Сбрасывает все фильтры к начальным значениям
      return initialFilters;
    default:
      throw new Error("Неизвестное действие для фильтра");
  }
}

function TransactionsPage() {
  const { activeWorkspace, accounts, fetchAccounts } = useAuth();

  // --- Состояния Компонента ---
  const [transactionsData, setTransactionsData] = useState({ items: [], total_count: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [filters, dispatch] = useReducer(filtersReducer, initialFilters);
  
  // Состояния для управления модальными окнами
  const [isFormModalOpen, setFormModalOpen] = useState(false);
  const [isUploadModalOpen, setUploadModalOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState(null);
  const [defaultTransactionType, setDefaultTransactionType] = useState('expense');
  const [transactionToDelete, setTransactionToDelete] = useState(null);


  // --- Загрузка данных ---
  const fetchTransactions = useCallback(async (page, currentFilters) => {
    if (!activeWorkspace) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError('');

    try {
      const params = new URLSearchParams({
        workspace_id: activeWorkspace.id,
        page: page,
        size: ITEMS_PER_PAGE,
      });
      // Динамически добавляем фильтры в параметры запроса, если они установлены
      if (currentFilters.start_date) params.append('start_date', format(currentFilters.start_date, 'yyyy-MM-dd'));
      if (currentFilters.end_date) params.append('end_date', format(currentFilters.end_date, 'yyyy-MM-dd'));
      if (currentFilters.transaction_type) params.append('transaction_type', currentFilters.transaction_type);
      if (currentFilters.account_id) params.append('account_id', currentFilters.account_id);

      const data = await apiService.get(`/transactions/?${params.toString()}`);
      setTransactionsData(data || { items: [], total_count: 0 });
    } catch (err) {
      setError(err.message || "Не удалось загрузить транзакции");
    } finally {
      setLoading(false);
    }
  }, [activeWorkspace]);

  // Эффект, который перезагружает данные при смене страницы или фильтров
  useEffect(() => {
    if (activeWorkspace) {
      fetchTransactions(currentPage, filters);
    }
  }, [currentPage, filters, fetchTransactions, activeWorkspace]);

  
  // --- Обработчики Действий ---
  const handleOpenFormModal = (type, transaction = null) => {
    setDefaultTransactionType(type);
    setEditingTransaction(transaction);
    setFormModalOpen(true);
  };
  
  const handleCloseFormModal = () => {
    setFormModalOpen(false);
    setEditingTransaction(null);
    fetchTransactions(currentPage, filters); // Обновляем транзакции
    fetchAccounts(); // Обновляем балансы счетов в контексте
  };

  const handleDeleteRequest = (tx) => {
    setTransactionToDelete(tx);
  };

  const handleDeleteConfirm = async () => {
    if (!transactionToDelete) return;
    try {
      await apiService.delete(`/transactions/${transactionToDelete.id}`);
      setTransactionToDelete(null);
      fetchTransactions(currentPage, filters);
      fetchAccounts();
    } catch(err) {
      setError(err.message || 'Не удалось удалить транзакцию');
      setTransactionToDelete(null);
    }
  };


  // --- Рендеринг ---
  if (loading && transactionsData.items.length === 0) {
    return <div className="flex justify-center items-center h-64"><Loader text="Загрузка транзакций..." /></div>;
  }
  
  if (!activeWorkspace) {
    return <Alert type="info">Пожалуйста, выберите или создайте рабочее пространство.</Alert>;
  }

  return (
    <Fragment>
      {/* -- ЗАГОЛОВОК И КНОПКИ ДЕЙСТВИЙ -- */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <PageTitle title="Транзакции" />
        <div className="flex items-center space-x-2">
            <Button onClick={() => setUploadModalOpen(true)} variant="outline" icon={<ArrowUpOnSquareIcon className="h-5 w-5"/>}>Загрузить</Button>
            <div className="inline-flex rounded-md shadow-sm">
                <Button onClick={() => handleOpenFormModal('expense')} className="rounded-r-none"><PlusIcon className="h-5 w-5 mr-2" />Добавить</Button>
                <Menu as="div" className="-ml-px relative block">
                    <Menu.Button className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 h-full"><ChevronDownIcon className="h-5 w-5" /></Menu.Button>
                    <Transition as={Fragment} enter="transition ease-out duration-100" enterFrom="transform opacity-0 scale-95" enterTo="transform opacity-100 scale-100" leave="transition ease-in duration-75" leaveFrom="transform opacity-100 scale-100" leaveTo="transform opacity-0 scale-95">
                        <Menu.Items className="origin-top-right absolute right-0 mt-2 w-56 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 focus:outline-none z-10">
                        <div className="py-1">
                            <Menu.Item>{({ active }) => (<button onClick={() => handleOpenFormModal('income')} className={`${active ? 'bg-gray-100' : ''} group flex w-full items-center px-4 py-2 text-sm text-gray-700`}><ArrowUpCircleIcon className="mr-3 h-5 w-5 text-green-500"/>Добавить доход</button>)}</Menu.Item>
                            <Menu.Item>{({ active }) => (<button onClick={() => handleOpenFormModal('expense')} className={`${active ? 'bg-gray-100' : ''} group flex w-full items-center px-4 py-2 text-sm text-gray-700`}><ArrowDownCircleIcon className="mr-3 h-5 w-5 text-red-500"/>Добавить расход</button>)}</Menu.Item>
                        </div>
                        </Menu.Items>
                    </Transition>
                </Menu>
            </div>
        </div>
      </div>
      
      {/* -- ПАНЕЛЬ ФИЛЬТРОВ -- */}
      <div className="p-4 bg-white rounded-xl shadow-sm mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
            <DateRangePicker 
              startDate={filters.start_date}
              endDate={filters.end_date}
              onStartDateChange={(date) => dispatch({ type: 'SET_FILTER', field: 'start_date', payload: date })}
              onEndDateChange={(date) => dispatch({ type: 'SET_FILTER', field: 'end_date', payload: date })}
            />
            <div>
              <label className="text-sm font-medium text-gray-700">Счет</label>
              <Select value={filters.account_id} onChange={(e) => dispatch({ type: 'SET_FILTER', field: 'account_id', payload: e.target.value })} className="mt-1">
                  <option value="">Все счета</option>
                  {accounts.map(acc => <option key={acc.id} value={acc.id}>{acc.name}</option>)}
              </Select>
            </div>
            <div className="flex items-end space-x-2">
                <div className="flex-grow">
                    <label className="text-sm font-medium text-gray-700">Тип</label>
                    <Select value={filters.transaction_type} onChange={(e) => dispatch({ type: 'SET_FILTER', field: 'transaction_type', payload: e.target.value })} className="mt-1 flex-grow">
                        <option value="">Все типы</option>
                        <option value="income">Доход</option>
                        <option value="expense">Расход</option>
                    </Select>
                </div>
                <Button onClick={() => dispatch({ type: 'RESET' })} variant="icon" title="Сбросить фильтры"><XMarkIcon className="h-6 w-6 text-gray-500 hover:text-gray-800"/></Button>
            </div>
        </div>
      </div>
      
      {loading && <div className="text-center py-4 text-gray-500">Обновление данных...</div>}
      {error && <Alert type="error" className="mb-4">{error}</Alert>}
      
      {/* -- ОСНОВНОЙ КОНТЕНТ -- */}
      {!loading && transactionsData.items.length === 0 ? (
         <EmptyState message="Нет транзакций, соответствующих вашим фильтрам." buttonText="Сбросить все фильтры" onButtonClick={() => dispatch({ type: 'RESET' })} />
      ) : (
        <>
          <div className="bg-white shadow-lg rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
                <table className="min-w-full">
                    <thead className="bg-gray-50">
                        <tr>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Дата</th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Счет / Статья</th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Описание</th>
                            <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Сумма</th>
                            <th scope="col" className="relative px-6 py-3"><span className="sr-only">Действия</span></th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {transactionsData.items.map((tx) => (
                        <tr key={tx.id} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{format(parseISO(tx.date), 'dd MMMM yyyy', { locale: ru })}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm">
                                <div className="font-medium text-gray-900">{tx.account?.name}</div>
                                <div className="text-gray-500">{tx.dds_article?.name || 'Без статьи'}</div>
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-800 break-words max-w-xs truncate" title={tx.description}>{tx.description}</td>
                            <td className={`px-6 py-4 whitespace-nowrap text-sm text-right font-semibold ${tx.transaction_type === 'income' ? 'text-green-600' : 'text-red-600'}`}>
                                {tx.transaction_type === 'income' ? '+' : ''} {tx.amount.toLocaleString('ru-RU', { minimumFractionDigits: 2 })}
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
        <TransactionForm transaction={editingTransaction} defaultType={defaultTransactionType} onSuccess={handleCloseFormModal}/>
      </Modal>
      <StatementUploadModal isOpen={isUploadModalOpen} onClose={() => setUploadModalOpen(false)} onSuccess={() => fetchTransactions(1, initialFilters)} />
      <ConfirmationModal isOpen={Boolean(transactionToDelete)} onClose={() => setTransactionToDelete(null)} onConfirm={handleDeleteConfirm} title="Удалить транзакцию" message={`Вы уверены?`} />
    </Fragment>
  );
}
export default TransactionsPage;