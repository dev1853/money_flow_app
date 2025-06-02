// src/pages/TransactionsPage.jsx
import { useState, useEffect, useCallback, Fragment } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import Modal from '../components/Modal';
import TransactionForm from '../components/TransactionForm';
import StatementUploadModal from '../components/StatementUploadModal';
import ConfirmationModal from '../components/ConfirmationModal';
import { 
    PlusIcon, 
    ListBulletIcon, 
    FunnelIcon, 
    ArrowPathIcon, 
    ExclamationTriangleIcon,
    ArrowUpTrayIcon,
    ArrowDownTrayIcon as AddExpenseIcon,
    PencilSquareIcon,
    TrashIcon,
    ArrowDownTrayIcon as UploadIcon
} from '@heroicons/react/24/solid';
import { useAuth } from '../contexts/AuthContext';

import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";
import { format, isValid, parseISO } from 'date-fns'; 
import { ru } from 'date-fns/locale';

const TransactionsPage = () => {
  const location = useLocation(); 

  const [transactions, setTransactions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const [formModalState, setFormModalState] = useState({ 
    isOpen: false, 
    type: null, 
    editingTransaction: null
  });
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [isConfirmDeleteModalOpen, setIsConfirmDeleteModalOpen] = useState(false); // Объявление состояния
  const [transactionToDelete, setTransactionToDelete] = useState(null);       // Объявление состояния

  const [filterStartDate, setFilterStartDate] = useState(null); 
  const [filterEndDate, setFilterEndDate] = useState(null);   
  const [filterAccountId, setFilterAccountId] = useState('');
  const [filterDdsArticleIds, setFilterDdsArticleIds] = useState([]);
  const [filterMinAmount, setFilterMinAmount] = useState('');
  const [filterMaxAmount, setFilterMaxAmount] = useState('');
  const [availableAccounts, setAvailableAccounts] = useState([]);

  const navigate = useNavigate();
  const { token, isAuthenticated, isLoading: isAuthLoading } = useAuth();

  const commonLabelClasses = "block text-sm font-medium text-gray-700 mb-1";
  const commonInputClasses = "mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm h-10";
  
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const startDateFromUrl = params.get('start_date');
    const endDateFromUrl = params.get('end_date');
    const accountIdFromUrl = params.get('account_id');
    const articleIdsFromUrl = params.getAll('dds_article_ids');
    const minAmountFromUrl = params.get('min_amount');
    const maxAmountFromUrl = params.get('max_amount');

    if (startDateFromUrl && isValid(parseISO(startDateFromUrl))) {
      setFilterStartDate(parseISO(startDateFromUrl));
    } else if (!startDateFromUrl && filterStartDate !== null) {
        setFilterStartDate(null);
    }
    if (endDateFromUrl && isValid(parseISO(endDateFromUrl))) {
      setFilterEndDate(parseISO(endDateFromUrl));
    } else if (!endDateFromUrl && filterEndDate !== null) {
        setFilterEndDate(null);
    }
    if (accountIdFromUrl && accountIdFromUrl !== filterAccountId) {
      setFilterAccountId(accountIdFromUrl);
    } else if (!accountIdFromUrl && filterAccountId !== '') {
        setFilterAccountId('');
    }
    if (articleIdsFromUrl && articleIdsFromUrl.length > 0) {
        if (JSON.stringify(articleIdsFromUrl.sort()) !== JSON.stringify(filterDdsArticleIds.sort())) {
            setFilterDdsArticleIds(articleIdsFromUrl);
        }
    } else if (articleIdsFromUrl.length === 0 && filterDdsArticleIds.length > 0) {
        setFilterDdsArticleIds([]);
    }
    if (minAmountFromUrl && minAmountFromUrl !== filterMinAmount) {
        setFilterMinAmount(minAmountFromUrl);
    } else if (!minAmountFromUrl && filterMinAmount !== '') {
        setFilterMinAmount('');
    }
    if (maxAmountFromUrl && maxAmountFromUrl !== filterMaxAmount) {
        setFilterMaxAmount(maxAmountFromUrl);
    } else if (!maxAmountFromUrl && filterMaxAmount !== '') {
        setFilterMaxAmount('');
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.search]);

  const fetchAccountsForFilter = useCallback(async () => {
    if (!token || isAuthLoading) { setAvailableAccounts([]); return; }
    if (!token) return;
    
    const headers = { 'Authorization': `Bearer ${token}` };
    try {
      const response = await fetch('http://localhost:8000/accounts/?limit=500&is_active=true', { headers });
      if (!response.ok) throw new Error('Ошибка загрузки счетов для фильтра');
      const data = await response.json();
      setAvailableAccounts(data);
    } catch (err) {
      console.error("TransactionsPage: Ошибка загрузки счетов для фильтра:", err.message);
      setAvailableAccounts([]);
    }
  }, [token, isAuthLoading]);

  useEffect(() => {
    if (isAuthenticated && !isAuthLoading) {
      fetchAccountsForFilter();
    }
  }, [fetchAccountsForFilter, isAuthenticated, isAuthLoading]);

  const fetchTransactions = useCallback(async () => {
    if (isAuthLoading) { setIsLoading(true); return; }
    if (!isAuthenticated || !token) { 
      if (location.pathname !== '/login') navigate('/login'); 
      setIsLoading(false); 
      return;
    }

    setIsLoading(true); setError(null);
    const params = new URLSearchParams();
    if (filterStartDate && isValid(filterStartDate)) params.append('start_date', format(filterStartDate, 'yyyy-MM-dd'));
    if (filterEndDate && isValid(filterEndDate)) params.append('end_date', format(filterEndDate, 'yyyy-MM-dd'));
    if (filterAccountId) params.append('account_id', filterAccountId);
    if (filterMinAmount) params.append('min_amount', filterMinAmount);
    if (filterMaxAmount) params.append('max_amount', filterMaxAmount);
    filterDdsArticleIds.forEach(id => params.append('dds_article_ids', id));
    params.append('skip', '0'); 
    params.append('limit', '500'); 

    try {
      const headers = { 'Authorization': `Bearer ${token}` };
      const response = await fetch(`http://localhost:8000/transactions/?${params.toString()}`, { method: 'GET', headers: headers });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ detail: `Ошибка сервера: ${response.status}` }));
        if (response.status === 401) { 
            setError('Сессия истекла. Пожалуйста, войдите снова.');
            localStorage.removeItem('accessToken'); localStorage.removeItem('tokenType');
            if (location.pathname !== '/login') navigate('/login');
        } else { setError(`HTTP error! status: ${response.status}, message: ${errorData.detail || 'Не удалось загрузить транзакции'}`); }
        setTransactions([]); return;
      }
      const data = await response.json();
      setTransactions(data.items); // Используем data.items из TransactionsPageResponse
      // setTotalTransactions(data.total_count); // Если будете реализовывать пагинацию
    } catch (e) { 
      setError(e.message); 
      console.error("TransactionsPage: Error in fetchTransactions:", e);
    } 
    finally { setIsLoading(false); }
  }, [filterStartDate, filterEndDate, filterAccountId, filterMinAmount, filterMaxAmount, filterDdsArticleIds, token, isAuthenticated, isAuthLoading, navigate, location.pathname]);

  useEffect(() => {
    if (!isAuthLoading && isAuthenticated) { 
      fetchTransactions(); 
    } else if (!isAuthLoading && !isAuthenticated && location.pathname !== '/login') {
      navigate('/login'); 
    }
  }, [fetchTransactions, isAuthLoading, isAuthenticated, location.pathname, navigate]);

  const handleDateChange = (dates) => { const [start, end] = dates; setFilterStartDate(start); setFilterEndDate(end); };
  const handleApplyFilters = () => { fetchTransactions(); };
  const handleResetFilters = () => {
    setFilterStartDate(null); setFilterEndDate(null);
    setFilterAccountId(''); setFilterMinAmount(''); setFilterMaxAmount('');
    setFilterDdsArticleIds([]);
    if (location.search) {
        navigate('/transactions', { replace: true });
    } else {
        fetchTransactions();
    }
  };
  
  const handleOpenCreateModal = (type) => {
    setFormModalState({ isOpen: true, type: type, editingTransaction: null });
  };

  const handleOpenEditModal = (transaction) => {
    if (!transaction || !transaction.dds_article) {
        setError("Не удалось определить тип операции для редактирования.");
        return;
    }
    const operationType = transaction.dds_article.article_type;
    setFormModalState({ 
        isOpen: true, 
        type: operationType, 
        editingTransaction: transaction 
    });
  };
  
  const handleCloseFormModal = () => {
    setFormModalState({ isOpen: false, type: null, editingTransaction: null });
  };
  
  const handleTransactionProcessedSuccess = () => { 
    fetchTransactions();    
    setFormModalState({ isOpen: false, type: null, editingTransaction: null });  
  };

  const handleUploadSuccess = () => {
    setIsUploadModalOpen(false);
    fetchTransactions(); 
  };

  const handleOpenDeleteConfirmModal = (transaction) => {
    setTransactionToDelete(transaction);
    setIsConfirmDeleteModalOpen(true);
  };

  const handleCloseDeleteConfirmModal = () => {
    setTransactionToDelete(null);
    setIsConfirmDeleteModalOpen(false);
  };

  const handleConfirmDeleteTransaction = async () => {
    if (!transactionToDelete || !token) { 
      setError("Транзакция для удаления не выбрана или нет авторизации."); 
      setIsConfirmDeleteModalOpen(false); 
      return; 
    }
    // setIsLoading(true); // Можно использовать isLoading для всей страницы или отдельный для операции
    try {
      const headers = { 'Authorization': `Bearer ${token}` };
      const response = await fetch(`http://localhost:8000/transactions/${transactionToDelete.id}`, {
        method: 'DELETE', headers: headers,
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ detail: `Не удалось удалить транзакцию` }));
        throw new Error(errorData.detail || `Ошибка удаления: ${response.status}`);
      }
      fetchTransactions(); 
      setError(null); // Сбрасываем ошибку в случае успеха
    } catch (err) { setError(err.message); } 
    finally { 
      // setIsLoading(false); 
      handleCloseDeleteConfirmModal(); 
    }
  };

  const formatCurrency = (amount, currency = 'RUB') => {
    const value = parseFloat(amount);
    return isNaN(value) ? 'N/A' : value.toLocaleString('ru-RU', { style: 'currency', currency: currency, minimumFractionDigits: 2 });
  };
  
  if (isAuthLoading) {
    return (
      <div className="flex flex-col justify-center items-center min-h-[calc(100vh-8rem)]">
        <svg className="mx-auto h-12 w-12 animate-spin text-indigo-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        <p className="mt-2 text-gray-500">Проверка аутентификации...</p>
      </div>
    );
  }

  return (
    <>
      <div className="flex flex-col gap-4 mb-6 sm:flex-row sm:justify-between sm:items-center">
        <h2 className="text-2xl font-bold text-gray-900 md:text-3xl">
          Транзакции
        </h2>
        <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:gap-3 w-full sm:w-auto">
          <button type="button" onClick={() => handleOpenCreateModal('income')} disabled={!isAuthenticated}
            className="inline-flex items-center justify-center w-full rounded-md bg-green-600 px-3.5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-green-500 focus-visible:outline focus-visible:outline-offset-2 focus-visible:outline-green-600 disabled:opacity-50 sm:w-auto h-10"
          > <ArrowUpTrayIcon className="h-5 w-5 mr-2" /> Добавить доход </button>
          <button type="button" onClick={() => handleOpenCreateModal('expense')} disabled={!isAuthenticated}
            className="inline-flex items-center justify-center w-full rounded-md bg-red-600 px-3.5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-red-500 focus-visible:outline focus-visible:outline-offset-2 focus-visible:outline-red-600 disabled:opacity-50 sm:w-auto h-10"
          > <AddExpenseIcon className="h-5 w-5 mr-2" /> Добавить расход </button>
          <button type="button" onClick={() => setIsUploadModalOpen(true)} disabled={!isAuthenticated}
            className="inline-flex items-center justify-center w-full rounded-md bg-sky-600 px-3.5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-sky-500 focus-visible:outline focus-visible:outline-offset-2 focus-visible:outline-sky-600 disabled:opacity-50 sm:w-auto h-10"
          > <UploadIcon className="h-5 w-5 mr-2" /> Загрузить выписку </button>
        </div>
      </div>

      {!isAuthLoading && !isAuthenticated && (
        <div className="text-center py-10 text-gray-500">
            <ExclamationTriangleIcon className="mx-auto h-12 w-12 text-orange-400" />
            <h3 className="mt-2 text-lg font-semibold text-gray-900">Доступ запрещен</h3>
            <p className="mt-1 text-sm text-gray-500"> Пожалуйста, <Link to="/login" className="text-indigo-600 hover:underline font-medium">войдите в систему</Link> для просмотра транзакций. </p>
        </div>
      )}

      {!isAuthLoading && isAuthenticated && (
      <>
        <div className="p-4 bg-white shadow-lg rounded-xl mb-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Фильтры</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:flex lg:flex-wrap lg:items-end lg:gap-x-4 gap-y-4">
            <div className="lg:flex-auto lg:min-w-[260px]">
              <label htmlFor="dateRange" className={commonLabelClasses}>Период</label>
              <DatePicker selectsRange={true} startDate={filterStartDate} endDate={filterEndDate} onChange={handleDateChange} isClearable={true} dateFormat="dd.MM.yyyy" placeholderText="Выберите диапазон дат" locale={ru} className={`${commonInputClasses} w-full`} wrapperClassName="w-full"/>
            </div>
            <div className="lg:flex-auto lg:min-w-[200px]">
              <label htmlFor="filterAccountId" className={commonLabelClasses}>Счет/Касса</label>
              <select id="filterAccountId" value={filterAccountId} onChange={(e) => setFilterAccountId(e.target.value)} className={`${commonInputClasses} w-full`}>
                <option value="">Все счета</option>
                {availableAccounts.map(acc => <option key={acc.id} value={acc.id}>{acc.name} ({acc.currency})</option>)}
              </select>
            </div>
            <div className="lg:flex-auto lg:min-w-[130px] lg:max-w-xs">
              <label htmlFor="filterMinAmount" className={commonLabelClasses}>Сумма от</label>
              <input type="number" id="filterMinAmount" value={filterMinAmount} onChange={(e) => setFilterMinAmount(e.target.value)} placeholder="0.00" step="0.01" className={`${commonInputClasses} w-full`}/>
            </div>
            <div className="lg:flex-auto lg:min-w-[130px] lg:max-w-xs">
              <label htmlFor="filterMaxAmount" className={commonLabelClasses}>Сумма до</label>
              <input type="number" id="filterMaxAmount" value={filterMaxAmount} onChange={(e) => setFilterMaxAmount(e.target.value)} placeholder="100000" step="0.01" className={`${commonInputClasses} w-full`}/>
            </div>
            <div className="flex space-x-2 pt-1 sm:pt-5 lg:pt-0 lg:self-end w-full sm:w-auto">
              <button onClick={handleApplyFilters} className="inline-flex items-center justify-center px-3 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 h-10 flex-1 lg:flex-none" title="Применить фильтры"> 
                <FunnelIcon className="h-5 w-5 sm:mr-2" aria-hidden="true" /> <span className="hidden sm:inline">Применить</span>
              </button>
              <button onClick={handleResetFilters} className="inline-flex items-center justify-center px-3 py-2 border border-gray-300 text-sm font-medium rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 h-10 flex-1 lg:flex-none" title="Сбросить фильтры"> 
                <ArrowPathIcon className="h-5 w-5 sm:mr-2 text-gray-500" /> <span className="hidden sm:inline">Сбросить</span>
              </button>
            </div>
          </div>
          {filterDdsArticleIds.length > 0 && (
            <div className="mt-4 col-span-1 sm:col-span-2 lg:col-span-full p-2 bg-indigo-50 border border-indigo-200 rounded-md text-sm text-indigo-700">
                Применен фильтр по статье ДДС ID: {filterDdsArticleIds.join(', ')}. 
                <button onClick={handleResetFilters} className="ml-2 font-semibold underline hover:text-indigo-900">Сбросить все фильтры</button>
            </div>
          )}
          {/* Блок общей ошибки для страницы, если она не связана с загрузкой списка транзакций */}
          {error && !isLoading && ( 
            <div className="mt-4 rounded-md bg-red-50 p-3">
              <div className="flex">
                <div className="flex-shrink-0">
                  <ExclamationTriangleIcon className="h-5 w-5 text-red-400" aria-hidden="true" />
                </div>
                <div className="ml-2">
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              </div>
            </div>
          )}
        </div>
      
        <Modal 
          isOpen={formModalState.isOpen} 
          onClose={handleCloseFormModal} 
          title={formModalState.editingTransaction 
                    ? `Редактирование операции ID: ${formModalState.editingTransaction.id}` 
                    : (formModalState.type === 'income' ? "Добавить доход" : "Добавить расход")}
        >
          <TransactionForm 
            onTransactionProcessed={handleTransactionProcessedSuccess}
            transactionToEdit={formModalState.editingTransaction}
            operationType={formModalState.type}
            onCancelEdit={handleCloseFormModal} 
            key={formModalState.isOpen ? `form-${formModalState.type}-${formModalState.editingTransaction?.id || 'create'}` : 'form-closed'}
          />
        </Modal>

        <StatementUploadModal
            isOpen={isUploadModalOpen}
            onClose={() => setIsUploadModalOpen(false)}
            onUploadSuccess={handleUploadSuccess}
        />
        <ConfirmationModal
            isOpen={isConfirmDeleteModalOpen}
            onClose={handleCloseDeleteConfirmModal}
            title="Подтверждение удаления"
            message={`Вы уверены, что хотите удалить транзакцию: "${transactionToDelete?.description?.substring(0,30) || `ID: ${transactionToDelete?.id}`}"? Это действие отменит влияние операции на баланс счета.`}
            onConfirm={handleConfirmDeleteTransaction}
            confirmText="Удалить"
            cancelText="Отмена"
            confirmButtonVariant="danger"
        />
        
        <div className="mt-8">
          {isLoading && ( // Локальный лоадер для списка транзакций (когда isAuthLoading уже false)
            <div className="text-center py-10 text-gray-500"> 
              <svg className="mx-auto h-12 w-12 animate-spin text-indigo-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <p className="mt-2">Загрузка операций...</p>
            </div>
          )}
          
          {!isLoading && error && ( // Ошибка загрузки транзакций
            <div className="rounded-md bg-red-50 p-4 my-4 shadow">
              <div className="flex">
                <div className="flex-shrink-0">
                  <ExclamationTriangleIcon className="h-5 w-5 text-red-400" aria-hidden="true" />
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-red-800">Ошибка загрузки транзакций</h3>
                  <div className="mt-2 text-sm text-red-700"><p>{error}</p></div>
                </div>
              </div>
            </div>
          )}

          {!isLoading && !error && transactions.length === 0 && (
            <div className="text-center py-16 bg-white shadow-lg rounded-xl">
              <ListBulletIcon className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-lg font-semibold text-gray-900">Операций пока нет</h3>
              <p className="mt-1 text-sm text-gray-500">Попробуйте изменить фильтры или добавьте первую операцию.</p>
            </div>
          )}

          {!isLoading && !error && transactions.length > 0 && (
            <div className="bg-white shadow-md rounded-lg">
              {/* Мобильные карточки */}
              <div className="sm:hidden divide-y divide-gray-200">
                {transactions.map((transaction) => (
                  <div key={transaction.id} className="p-4">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-sm font-medium text-gray-500">
                        {transaction.transaction_date ? format(parseISO(transaction.transaction_date), 'dd.MM.yy') : 'N/A'}
                      </span>
                      <span className={`text-lg font-semibold ${transaction.dds_article?.article_type === 'income' ? 'text-green-600' : 'text-red-600'}`}>
                        {transaction.dds_article?.article_type === 'income' ? '+' : '-'}
                        {formatCurrency(transaction.amount, transaction.account?.currency)}
                      </span>
                    </div>
                    <p className="text-sm text-gray-700 font-medium truncate" title={transaction.dds_article?.name || 'Статья не указана'}>
                      <span className="text-gray-500">Статья: </span>{transaction.dds_article?.name || 'N/A'}
                    </p>
                    <p className="text-sm text-gray-700 truncate" title={transaction.account?.name || 'Счет не указан'}>
                      <span className="text-gray-500">Счет: </span>{transaction.account?.name || 'N/A'}
                    </p>
                    {transaction.description && (
                      <p className="mt-1 text-xs text-gray-500 truncate" title={transaction.description}>
                        <span className="text-gray-500">Описание: </span>{transaction.description}
                      </p>
                    )}
                    {transaction.created_by && (
                       <p className="mt-1 text-xs text-gray-500">
                        <span className="text-gray-500">Создал: </span>{transaction.created_by.full_name || transaction.created_by.username}
                       </p>
                    )}
                    <div className="mt-3 flex justify-end space-x-2">
                      <button 
                        onClick={() => handleOpenEditModal(transaction)}
                        className="p-1.5 text-blue-600 hover:text-blue-800 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        title="Редактировать транзакцию"
                      >
                        <PencilSquareIcon className="h-5 w-5"/>
                      </button>
                      <button 
                        onClick={() => handleOpenDeleteConfirmModal(transaction)}
                        className="p-1.5 text-red-500 hover:text-red-700 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                        title="Удалить транзакцию"
                      >
                        <TrashIcon className="h-5 w-5"/>
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Десктопная таблица */}
              <div className="hidden sm:block overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider sm:pl-6">Дата</th>
                      <th scope="col" className="px-3 py-3.5 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Сумма</th>
                      <th scope="col" className="px-3 py-3.5 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Счет/Касса</th>
                      <th scope="col" className="px-3 py-3.5 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Статья ДДС</th>
                      <th scope="col" className="px-3 py-3.5 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Описание</th>
                      <th scope="col" className="px-3 py-3.5 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Создал</th>
                      <th scope="col" className="relative py-3.5 pl-3 pr-4 sm:pr-6"><span className="sr-only">Действия</span></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 bg-white">
                    {transactions.map((transaction) => (
                      <tr key={transaction.id} className="even:bg-gray-50 hover:bg-indigo-50/50 transition-colors">
                        <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-6">
                          {transaction.transaction_date ? format(parseISO(transaction.transaction_date), 'dd.MM.yyyy') : 'N/A'}
                        </td>
                        <td className={`whitespace-nowrap px-3 py-4 text-sm font-medium ${
                          transaction.dds_article?.article_type === 'income' ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {transaction.dds_article?.article_type === 'income' ? '+' : '-'}
                          {formatCurrency(transaction.amount, transaction.account?.currency)}
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">{transaction.account?.name || 'N/A'}</td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">{transaction.dds_article?.name || 'N/A'}</td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500 max-w-xs truncate" title={transaction.description}>
                          {transaction.description || ''}
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                          {transaction.created_by ? (transaction.created_by.full_name || transaction.created_by.username) : 'N/A'}
                        </td>
                        <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6 space-x-1">
                          <button 
                            onClick={() => handleOpenEditModal(transaction)}
                            className="p-1 text-indigo-600 hover:text-indigo-900 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            title="Редактировать транзакцию"
                          >
                            <PencilSquareIcon className="h-5 w-5"/>
                          </button>
                          <button 
                            onClick={() => handleOpenDeleteConfirmModal(transaction)}
                            className="p-1 text-red-600 hover:text-red-800 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                            title="Удалить транзакцию"
                          >
                            <TrashIcon className="h-5 w-5"/>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </>
      )}
    </>
  );
};

export default TransactionsPage;