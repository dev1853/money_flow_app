// frontend/src/pages/TransactionsPage.jsx
import { useState, useEffect, useCallback, Fragment } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import Modal from '../components/Modal';
import TransactionForm from '../components/TransactionForm';
import StatementUploadModal from '../components/StatementUploadModal';
import ConfirmationModal from '../components/ConfirmationModal';
import { useAuth } from '../contexts/AuthContext';

// Наши компоненты
import Loader from '../components/Loader';
import Button from '../components/Button';
import PageTitle from '../components/PageTitle';
import Alert from '../components/Alert';
import EmptyState from '../components/EmptyState';
import Select from '../components/forms/Select';
import Pagination from '../components/Pagination';
import Input from '../components/forms/Input'; // Убедитесь, что этот компонент существует
import Label from '../components/forms/Label'; // Убедитесь, что этот компонент существует
import { apiService, ApiError } from '../services/apiService'; // Убедитесь, что ApiError импортирован

import {
    PlusIcon,
    ListBulletIcon,
    FunnelIcon,
    ArrowPathIcon,
    CheckCircleIcon,
    ArrowUpTrayIcon, // Для Добавить доход
    ArrowDownTrayIcon as AddExpenseIcon, // Для Добавить расход
    PencilSquareIcon,
    TrashIcon,
    ArrowDownTrayIcon as UploadIcon // Для Загрузить выписку
} from '@heroicons/react/24/solid';

import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";
import { format, isValid, parseISO } from 'date-fns';
import { ru } from 'date-fns/locale';

const ITEMS_PER_PAGE = 20;

const TransactionsPage = () => {
  const location = useLocation();
  const { activeWorkspace, user, isLoading: authLoading, accounts, fetchAccounts } = useAuth();
  
  const [transactions, setTransactions] = useState([]); // Убедитесь, что это всегда []
  const [totalTransactions, setTotalTransactions] = useState(0); 
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState(null);

  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [uploadSuccessMessage, setUploadSuccessMessage] = useState('');
  const [uploadErrorMessage, setUploadErrorMessage] = useState('');

  const [isDeleteConfirmModalOpen, setIsDeleteConfirmModalOpen] = useState(false);
  const [transactionToDelete, setTransactionToDelete] = useState(null);

  // Состояния для фильтрации
  const [filters, setFilters] = useState({
      account_id: null, 
      start_date: null,
      end_date: null,
      transaction_type: null,
      dds_article_id: null
  });

  // fetchAccounts уже предоставлен через useAuth, не нужно объявлять его снова

  const fetchTransactions = useCallback(async () => {
    if (!activeWorkspace) {
      setError("Пожалуйста, выберите рабочее пространство, чтобы увидеть транзакции.");
      setTransactions([]); // Убедитесь, что transactions всегда пустой массив при ошибке
      setTotalPages(0);
      return;
    }

    if (!accounts || accounts.length === 0) {
        if (!authLoading && !accounts) {
            fetchAccounts(activeWorkspace.id);
        }
        setError("Нет доступных счетов в выбранном рабочем пространстве. Пожалуйста, создайте счет.");
        setTransactions([]); // Убедитесь, что transactions всегда пустой массив при ошибке
        setTotalPages(0);
        return;
    }

    let selectedAccountId = filters.account_id;
    if (!selectedAccountId && accounts.length > 0) {
        selectedAccountId = accounts[0].id; 
    }
    
    if (!accountIdToFetch) { // Здесь была опечатка, должно быть selectedAccountId
        setError("Пожалуйста, выберите счет или создайте его, чтобы просмотреть транзакции.");
        setTransactions([]);
        setTotalPages(0);
        return;
    }


    setIsLoading(true);
    setError('');

    try {
      const params = {
        skip: (currentPage - 1) * ITEMS_PER_PAGE,
        limit: ITEMS_PER_PAGE,
        workspace_id: activeWorkspace.id, 
        account_id: accountIdToFetch, 
        start_date: filters.start_date ? format(filters.start_date, 'yyyy-MM-dd') : undefined,
        end_date: filters.end_date ? format(filters.end_date, 'yyyy-MM-dd') : undefined,
        transaction_type: filters.transaction_type || undefined,
        dds_article_id: filters.dds_article_id || undefined
      };
      
      const response = await apiService.get('/transactions', params); 
      setTransactions(response.items);
      setTotalTransactions(response.total_count);
      setTotalPages(Math.ceil(response.total_count / ITEMS_PER_PAGE));
    } catch (err) {
      console.error("TransactionsPage: Error in fetchTransactions:", err);
      // Важно: если err.response.json() содержит детали ошибки, отобразить их
      const errorDetail = err.response && err.response.data && err.response.data.detail ? err.response.data.detail : (err.message || "Неизвестная ошибка.");
      setError("Не удалось загрузить транзакции: " + errorDetail);
      setTransactions([]); // Убедитесь, что transactions всегда пустой массив при ошибке
      setTotalPages(0);
    } finally {
      setIsLoading(false);
    }
  }, [currentPage, activeWorkspace, filters, accounts, authLoading, fetchAccounts]);

  useEffect(() => {
    if (activeWorkspace) {
        fetchAccounts(activeWorkspace.id);
    }
  }, [activeWorkspace, fetchAccounts]);


  useEffect(() => {
    if (activeWorkspace && accounts) { 
        fetchTransactions();
    }
  }, [fetchTransactions, activeWorkspace, accounts]);

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  const handleAddTransaction = (type) => {
    setEditingTransaction({ operationType: type, account_id: filters.account_id || (accounts.length > 0 ? accounts[0].id : null) });
    setIsModalOpen(true);
  };

  const handleEditTransaction = (transaction) => {
    setEditingTransaction(transaction);
    setIsModalOpen(true);
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    setEditingTransaction(null);
    fetchTransactions(); 
  };

  const handleUploadModalOpen = () => setIsUploadModalOpen(true);
  const handleUploadModalClose = (success) => {
      setIsUploadModalOpen(false);
      if (success) {
          setUploadSuccessMessage('Выписка успешно загружена!');
          fetchTransactions();
      }
  };

  const handleDeleteConfirmModalOpen = (transaction) => {
      setTransactionToDelete(transaction);
      setIsDeleteConfirmModalOpen(true);
  };

  const handleDeleteConfirmModalClose = () => {
      setTransactionToDelete(null);
      setIsDeleteConfirmModalOpen(false);
  };

  const handleDeleteTransaction = async () => {
    if (!transactionToDelete) return;

    try {
      await apiService.delete(`/transactions/${transactionToDelete.id}`);
      setUploadSuccessMessage('Транзакция успешно удалена.');
      fetchTransactions();
    } catch (err) {
      console.error("TransactionsPage: Ошибка при удалении транзакции:", err);
      setUploadErrorMessage("Ошибка при удалении транзакции: " + (err.message || "Неизвестная ошибка."));
    } finally {
      handleDeleteConfirmModalClose();
    }
  };

  const handleFilterChange = (name, value) => {
    setFilters(prev => ({ ...prev, [name]: value }));
    setCurrentPage(1); 
  };

  if (authLoading) {
    return <Loader message="Загрузка пользовательских данных..." />;
  }

  if (!activeWorkspace) {
    return (
      <Alert type="info" message="Пожалуйста, выберите рабочее пространство в шапке сайта или создайте его, чтобы управлять транзакциями." />
    );
  }

  // Обновленное условие для отображения таблицы:
  // Отображаем таблицу только если transactions не undefined/null И является массивом И в нем есть элементы.
  // Или если totalTransactions > 0.
  // Это также исправит "Cannot read properties of undefined (reading 'map')"
  return (
    <>
      <PageTitle title="Транзакции" />
      
      {error && <Alert type="error" message={error} />}
      {uploadSuccessMessage && <Alert type="success" message={uploadSuccessMessage} onClose={() => setUploadSuccessMessage('')} />}
      {uploadErrorMessage && <Alert type="error" message={uploadErrorMessage} onClose={() => setUploadErrorMessage('')} />}


      <div className="bg-white shadow-sm rounded-lg p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
            {/* Выбор счета для фильтрации */}
            <div>
                <label htmlFor="account-filter" className="block text-sm font-medium text-gray-700 mb-1">
                    Фильтр по счету
                </label>
                <Select
                    id="account-filter"
                    name="account_id"
                    value={filters.account_id || ''}
                    onChange={(e) => handleFilterChange('account_id', e.target.value ? parseInt(e.target.value) : null)}
                    options={accounts?.map(acc => ({ value: acc.id, label: acc.name })) || []}
                    placeholder="Все счета"
                    disabled={accounts.length === 0}
                />
            </div>

            {/* Фильтр по типу транзакции (Доход/Расход) */}
            <div>
                <label htmlFor="transaction-type-filter" className="block text-sm font-medium text-gray-700 mb-1">
                    Тип транзакции
                </label>
                <Select
                    id="transaction-type-filter"
                    name="transaction_type"
                    value={filters.transaction_type || ''}
                    onChange={(e) => handleFilterChange('transaction_type', e.target.value || null)}
                    options={[
                        { value: 'income', label: 'Доход' },
                        { value: 'expense', label: 'Расход' },
                    ]}
                    placeholder="Все типы"
                />
            </div>

            {/* Фильтр по статьям ДДС */}
            <div>
                <label htmlFor="dds-article-filter" className="block text-sm font-medium text-gray-700 mb-1">
                    Статья ДДС
                </label>
                {/* Здесь нужен компонент для выбора статьи ДДС.
                    Предполагаем, что у вас есть allDdsArticles и вы можете их фильтровать по типу. */}
                {/* <Select
                    id="dds-article-filter"
                    name="dds_article_id"
                    value={filters.dds_article_id || ''}
                    onChange={(e) => handleFilterChange('dds_article_id', e.target.value ? parseInt(e.target.value) : null)}
                    options={allDdsArticles.map(article => ({ value: article.id, label: article.name }))} // allDdsArticles должен быть доступен
                    placeholder="Все статьи"
                /> */}
                <Input
                    id="dds-article-filter-temp"
                    name="dds_article_id"
                    type="text"
                    label="Статья ДДС (временно)"
                    placeholder="ID статьи (временно)"
                    value={filters.dds_article_id || ''}
                    onChange={(e) => handleFilterChange('dds_article_id', e.target.value ? parseInt(e.target.value) : null)}
                />
            </div>
            {/* Кнопка применения фильтров, если нужно */}
            <div className="flex items-end">
                <Button onClick={fetchTransactions} variant="secondary" size="md">
                    Применить фильтры
                </Button>
            </div>
        </div>
        <div className="flex justify-end space-x-3 mt-4">
            <Button onClick={handleUploadModalOpen} variant="secondary" size="md" icon={<UploadIcon className="h-5 w-5" />} >
                Загрузить выписку
            </Button>
            <Button onClick={() => handleAddTransaction('income')} variant="success" size="md" icon={<PlusIcon className="h-5 w-5" />} >
                Добавить доход
            </Button>
            <Button onClick={() => handleAddTransaction('expense')} variant="danger" size="md" icon={<AddExpenseIcon className="h-5 w-5" />} >
                Добавить расход
            </Button>
        </div>
      </div>

      {isLoading ? (
        <Loader message="Загрузка транзакций..." />
      ) : error ? (
        <Alert type="error" message={error} />
      ) : (transactions && transactions.length > 0) ? (
        <Fragment>
          <div className="mt-6 flow-root">
            <div className="-mx-4 -my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
              <div className="inline-block min-w-full py-2 align-middle sm:px-6 lg:px-8">
                <table className="min-w-full divide-y divide-gray-300">
                  <thead>
                    <tr>
                      <th scope="col" className="whitespace-nowrap py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-0">
                        Дата
                      </th>
                      <th scope="col" className="whitespace-nowrap px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                        Счет
                      </th>
                      <th scope="col" className="whitespace-nowrap px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                        Тип
                      </th>
                      <th scope="col" className="whitespace-nowrap px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                        Статья ДДС
                      </th>
                      <th scope="col" className="whitespace-nowrap px-3 py-3.5 text-right text-sm font-semibold text-gray-900">
                        Сумма
                      </th>
                      <th scope="col" className="whitespace-nowrap px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                        Описание
                      </th>
                      <th scope="col" className="whitespace-nowrap px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                        Создана
                      </th>
                      <th scope="col" className="relative py-3.5 pl-3 pr-4 sm:pr-0">
                        <span className="sr-only">Действия</span>
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {transactions?.items?.length > 0 ? (
                      transactions?.items?.map((transaction) => (
                        <tr key={transaction.id} className="border-b hover:bg-gray-50">
                          <td className="py-3 px-4 text-sm text-gray-700">
                            {isValid(parseISO(transaction.date)) 
                              ? format(parseISO(transaction.date), 'dd.MM.yyyy', { locale: ru }) 
                              : 'Неверная дата'}
                          </td>
                          <td className="py-3 px-4 text-sm text-gray-700 max-w-xs truncate" title={transaction.description}>
                            {transaction.description}
                          </td>
                          <td className={`py-3 px-4 text-sm text-right ${transaction.amount > 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {transaction.amount.toFixed(2)}
                          </td>
                          <td className="py-3 px-4 text-sm text-gray-500">
                            {transaction.account?.name || 'N/A'}
                          </td>
                          <td className="py-3 px-4 text-sm text-gray-500">
                            {transaction.dds_article?.name || 'N/A'}
                          </td>
                          <td className="py-3 px-4 text-sm text-center">
                            <Button variant="icon" onClick={() => handleEditTransaction(transaction)} title="Редактировать">
                              <PencilSquareIcon className="h-5 w-5" />
                            </Button>
                            <Button variant="icon" onClick={() => handleOpenDeleteConfirmModal(transaction)} title="Удалить" className="text-red-500">
                              <TrashIcon className="h-5 w-5" />
                            </Button>
                          </td>
                        </tr>
                      ))
                    ) : (
                      // Этот блок отображается, если транзакций нет.
                      <tr>
                        <td colSpan="6" className="text-center py-8 text-gray-500">
                          {loading ? 'Загрузка транзакций...' : 'Транзакции не найдены.'}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
            {totalPages > 0 && (
                <Pagination
                    currentPage={currentPage}
                    totalPages={totalPages}
                    onPageChange={handlePageChange}
                    itemsPerPage={ITEMS_PER_PAGE}
                    totalItems={totalTransactions}
                />
            )}
          </div>
        </Fragment>
      ) : (
        <EmptyState message="Нет транзакций для отображения. Добавьте первую!" />
      )}

      <Modal isOpen={isModalOpen} onClose={handleModalClose} title={editingTransaction ? 'Редактировать транзакцию' : 'Добавить новую транзакцию'}>
        <TransactionForm
          transaction={editingTransaction}
          onSuccess={handleModalClose}
          onError={(msg) => setError(msg)}
        />
      </Modal>

      <StatementUploadModal isOpen={isUploadModalOpen} onClose={handleUploadModalClose} />

      <ConfirmationModal
        isOpen={isDeleteConfirmModalOpen}
        onClose={handleDeleteConfirmModalClose}
        onConfirm={handleDeleteTransaction}
        title="Удалить транзакцию"
        message={`Вы уверены, что хотите удалить транзакцию "${transactionToDelete?.description}"? Это действие необратимо.`}
      />
    </>
  );
};

export default TransactionsPage;