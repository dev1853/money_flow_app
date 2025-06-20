import React, { useState, useEffect, useCallback, Fragment } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { apiService } from '../services/apiService';
import { format, parseISO } from 'date-fns';
import { ru } from 'date-fns/locale';
import { Menu, Transition } from '@headlessui/react'; // Headless UI

// Компоненты
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
import DatePicker from '../components/forms/DatePicker';
import "react-datepicker/dist/react-datepicker.css";
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

function TransactionsPage() {
  const { activeWorkspace, accounts } = useAuth();

  // Состояния данных и UI
  const [transactionsData, setTransactionsData] = useState({ items: [], total_count: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Состояния пагинации и фильтров
  const [currentPage, setCurrentPage] = useState(1);
  const [filters, setFilters] = useState({
      start_date: null,
      end_date: null,
      transaction_type: '',
      account_id: '',
  });

  // Состояния модальных окон
  const [isFormModalOpen, setFormModalOpen] = useState(false);
  const [isUploadModalOpen, setUploadModalOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState(null);
  const [defaultTransactionType, setDefaultTransactionType] = useState('expense'); // 'expense' или 'income'
  const [transactionToDelete, setTransactionToDelete] = useState(null);

  // --- Загрузка данных с учетом фильтров и пагинации ---
  const fetchTransactions = useCallback(async (page, currentFilters) => {
    if (!activeWorkspace) return;
    setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams({
        workspace_id: activeWorkspace.id,
        page: page,
        size: ITEMS_PER_PAGE,
      });
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

  useEffect(() => {
    fetchTransactions(currentPage, filters);
  }, [currentPage, filters, fetchTransactions]);

  // --- Обработчики ---
  const handleFilterChange = (field, value) => {
    setFilters(prev => ({ ...prev, [field]: value }));
    setCurrentPage(1); // Сбрасываем на первую страницу при смене фильтра
  };

  const handleResetFilters = () => {
    setFilters({ startDate: null, endDate: null, type: '', accountId: '' });
    setCurrentPage(1);
  };
  
  const handleOpenModal = (type, transaction = null) => {
    setDefaultTransactionType(type);
    setEditingTransaction(transaction);
    setFormModalOpen(true);
  };
  
  const handleCloseModal = () => {
    setFormModalOpen(false);
    setEditingTransaction(null);
    fetchTransactions(currentPage, filters); // Обновляем данные после закрытия
  };

  const handleDeleteRequest = (tx) => setTransactionToDelete(tx);
  const handleDeleteConfirm = async () => { /* ... логика удаления ... */ };
  
  if (loading && transactionsData.items.length === 0) return <Loader text="Загрузка транзакций..." />;

  return (
    <Fragment>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
                <PageTitle title="Транзакции" />
                
                {/* --- НОВЫЙ БЛОК КНОПОК --- */}
                <div className="flex items-center space-x-2">
                    
                    {/* Кнопка загрузки выписки остается отдельной */}
                    <Button onClick={() => setUploadModalOpen(true)} variant="outline" icon={<ArrowUpOnSquareIcon className="h-5 w-5"/>}>
                        Загрузить
                    </Button>

                    {/* Комбинированная кнопка "Добавить транзакцию" */}
                    <div className="inline-flex rounded-md shadow-sm">
                        <Button
                            onClick={() => handleOpenModal('expense')} // Основное действие - добавить расход
                            className="rounded-r-none" // Убираем скругление справа
                        >
                            <PlusIcon className="h-5 w-5 mr-2" />
                            Добавить транзакцию
                        </Button>
                        <Menu as="div" className="-ml-px relative block">
                            <Menu.Button className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 focus:z-10 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 h-full">
                                <span className="sr-only">Открыть опции</span>
                                <ChevronDownIcon className="h-5 w-5" aria-hidden="true" />
                            </Menu.Button>
                            <Transition
                                as={Fragment}
                                enter="transition ease-out duration-100"
                                enterFrom="transform opacity-0 scale-95"
                                enterTo="transform opacity-100 scale-100"
                                leave="transition ease-in duration-75"
                                leaveFrom="transform opacity-100 scale-100"
                                leaveTo="transform opacity-0 scale-95"
                            >
                                <Menu.Items className="origin-top-right absolute right-0 mt-2 w-56 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 focus:outline-none z-10">
                                <div className="py-1">
                                    <Menu.Item>
                                    {({ active }) => (
                                        <a href="#" onClick={(e) => { e.preventDefault(); handleOpenModal('income'); }} className={`${active ? 'bg-gray-100 text-gray-900' : 'text-gray-700'} group flex items-center px-4 py-2 text-sm`}>
                                            <ArrowUpCircleIcon className="mr-3 h-5 w-5 text-green-500 group-hover:text-green-600" aria-hidden="true" />
                                            Добавить доход
                                        </a>
                                    )}
                                    </Menu.Item>
                                    <Menu.Item>
                                    {({ active }) => (
                                        <a href="#" onClick={(e) => { e.preventDefault(); handleOpenModal('expense'); }} className={`${active ? 'bg-gray-100 text-gray-900' : 'text-gray-700'} group flex items-center px-4 py-2 text-sm`}>
                                            <ArrowDownCircleIcon className="mr-3 h-5 w-5 text-red-500 group-hover:text-red-600" aria-hidden="true" />
                                            Добавить расход
                                        </a>
                                    )}
                                    </Menu.Item>
                                </div>
                                </Menu.Items>
                            </Transition>
                        </Menu>
                    </div>
                </div>
            </div>
      
      <div className="p-4 bg-white rounded-xl shadow-sm mb-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 items-end">
                    <div className="font-medium text-gray-700 flex items-center col-span-1 md:col-span-2 lg:col-span-1">
                        <FunnelIcon className="h-5 w-5 mr-2 text-gray-400"/>Фильтры:
                    </div>
                    
                    {/* --- ИЗМЕНЕНИЕ 2: Используем наш кастомный DatePicker --- */}
                    <DatePicker 
                        selected={filters.start_date} 
                        onChange={(date) => handleFilterChange('start_date', date)}
                        placeholderText="Дата С"
                        isClearable // Дополнительный пропс, который мы можем передать
                    />
                    <DatePicker 
                        selected={filters.end_date} 
                        onChange={(date) => handleFilterChange('end_date', date)}
                        placeholderText="Дата ПО"
                        isClearable
                    />

                    {/* Остальные фильтры остаются без изменений */}
                    <Select value={filters.account_id} onChange={(e) => handleFilterChange('account_id', e.target.value)}>
                        <option value="">Все счета</option>
                        {accounts.map(acc => <option key={acc.id} value={acc.id}>{acc.name}</option>)}
                    </Select>
                    <div className="flex items-center space-x-2">
                        <Select value={filters.transaction_type} onChange={(e) => handleFilterChange('transaction_type', e.target.value)} className="flex-grow">
                            <option value="">Все типы</option>
                            <option value="income">Доход</option>
                            <option value="expense">Расход</option>
                        </Select>
                        <Button onClick={handleResetFilters} variant="icon" title="Сбросить фильтры"><XMarkIcon className="h-6 w-6 text-gray-500 hover:text-gray-800"/></Button>
                    </div>
                </div>
            </div>

      {loading && <p>Обновление данных...</p>}
      {error && <Alert type="error" className="mb-4">{error}</Alert>}
      
      {/* --- ТАБЛИЦА С ТРАНЗАКЦИЯМИ И ПАГИНАЦИЯ --- */}
      {!loading && transactionsData.items.length === 0 ? (
         <EmptyState message="Нет транзакций, соответствующих вашим фильтрам." buttonText="Сбросить фильтры" onButtonClick={handleResetFilters} />
      ) : (
        <>
          <div className="bg-white shadow rounded-lg overflow-x-auto">
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
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800">{tx.description}</td>
                        <td className={`px-6 py-4 whitespace-nowrap text-sm text-right font-semibold ${tx.transaction_type === 'income' ? 'text-green-600' : 'text-red-600'}`}>
                            {tx.transaction_type === 'income' ? '+' : '-'} {tx.amount.toLocaleString('ru-RU', { minimumFractionDigits: 2 })}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <button onClick={() => handleOpenModal(tx.transaction_type, tx)} className="text-indigo-600 hover:text-indigo-900"><PencilSquareIcon className="h-5 w-5"/></button>
                            <button onClick={() => handleDeleteRequest(tx)} className="text-red-600 hover:text-red-900 ml-4"><TrashIcon className="h-5 w-5"/></button>
                        </td>
                    </tr>
                    ))}
                </tbody>
                </table>
            </div>
          </div>
          </div>
          <Pagination
            currentPage={currentPage}
            totalPages={Math.ceil(transactionsData.total_count / ITEMS_PER_PAGE)}
            onPageChange={setCurrentPage}
          />
        </>
      )}

      {/* --- Модальные окна --- */}
      <Modal isOpen={isFormModalOpen} onClose={handleCloseModal} title={editingTransaction ? 'Редактировать транзакцию' : 'Новая транзакция'}>
        <TransactionForm
          transaction={editingTransaction}
          defaultType={defaultTransactionType}
          onSuccess={handleCloseModal}
        />
      </Modal>

      <StatementUploadModal isOpen={isUploadModalOpen} onClose={() => setUploadModalOpen(false)} onSuccess={() => fetchTransactions(1, filters)} />

      <ConfirmationModal isOpen={Boolean(transactionToDelete)} onClose={() => setTransactionToDelete(null)} onConfirm={handleDeleteConfirm} title="Удалить транзакцию" message={`Вы уверены?`} />
    </Fragment>
  );
}

export default TransactionsPage;