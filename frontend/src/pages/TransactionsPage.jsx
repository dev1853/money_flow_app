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
import Pagination from '../components/Pagination';
import { apiService, ApiError } from '../services/apiService';

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
  const { activeWorkspace } = useAuth(); // Получаем активное рабочее пространство

  const [transactions, setTransactions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const [currentPage, setCurrentPage] = useState(1);
  const [totalTransactions, setTotalTransactions] = useState(0);

  const [formModalState, setFormModalState] = useState({
    isOpen: false, type: null, editingTransaction: null
  });
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [isConfirmDeleteModalOpen, setIsConfirmDeleteModalOpen] = useState(false);
  const [transactionToDelete, setTransactionToDelete] = useState(null);

  const [filterStartDate, setFilterStartDate] = useState(null);
  const [filterEndDate, setFilterEndDate] = useState(null);
  const [filterAccountId, setFilterAccountId] = useState('');
  const [filterDdsArticleIds, setFilterDdsArticleIds] = useState([]);
  const [filterMinAmount, setFilterMinAmount] = useState('');
  const [filterMaxAmount, setFilterMaxAmount] = useState('');
  const [availableAccounts, setAvailableAccounts] = useState([]);

  const navigate = useNavigate();
  const { isAuthenticated, isLoading: isAuthLoading, logout } = useAuth();

  const TRANSACTION_FORM_ID = "transactionForm"; // Уникальный ID для формы транзакции
  const UPLOAD_MODAL_FORM_ID = "statementUploadForm"; // Уникальный ID для модалки загрузки выписки (для связи кнопок)


  const totalPages = Math.ceil(totalTransactions / ITEMS_PER_PAGE);

  const fetchAccountsForFilter = useCallback(async () => {
    if (isAuthLoading || !isAuthenticated || !activeWorkspace) {
      setAvailableAccounts([]);
      return;
    }
    try {
      const data = await apiService.get(`/accounts/?workspace_id=${activeWorkspace.id}&limit=500&is_active=true`);
      setAvailableAccounts(data || []);
    } catch (err) {
      console.error("TransactionsPage: Ошибка загрузки счетов для фильтра:", err);
    }
  }, [isAuthLoading, isAuthenticated, activeWorkspace]);

  const updateUrlWithParams = useCallback((page = currentPage, currentFilters) => {
    const params = new URLSearchParams();
    if (currentFilters.startDate && isValid(currentFilters.startDate)) params.set('start_date', format(currentFilters.startDate, 'yyyy-MM-dd'));
    if (currentFilters.endDate && isValid(currentFilters.endDate)) params.set('end_date', format(currentFilters.endDate, 'yyyy-MM-dd'));
    if (currentFilters.accountId) params.set('account_id', currentFilters.accountId);
    if (currentFilters.minAmount) params.set('min_amount', currentFilters.minAmount);
    if (currentFilters.maxAmount) params.set('max_amount', currentFilters.maxAmount);
    currentFilters.ddsArticleIds?.forEach(id => params.append('dds_article_ids', id));
    if (page > 1) params.set('page', page.toString());
    navigate(`${location.pathname}?${params.toString()}`, { replace: true });
  }, [navigate, location.pathname, currentPage]);


  const fetchTransactions = useCallback(async (pageToFetch, currentFiltersToUse) => {
    if (!activeWorkspace) {
        setIsLoading(false);
        return;
    }
    if (isAuthLoading || !isAuthenticated) {
      setIsLoading(false);
      if (!isAuthLoading && !isAuthenticated && location.pathname !== '/login') navigate('/login');
      return;
    }

    setIsLoading(true); setError(null);
    const params = new URLSearchParams();
    if (currentFiltersToUse.startDate && isValid(currentFiltersToUse.startDate)) params.append('start_date', format(currentFiltersToUse.startDate, 'yyyy-MM-dd'));
    if (currentFiltersToUse.endDate && isValid(currentFiltersToUse.endDate)) params.append('end_date', format(currentFiltersToUse.endDate, 'yyyy-MM-dd'));
    if (currentFiltersToUse.accountId) params.append('account_id', currentFiltersToUse.accountId);
    if (currentFiltersToUse.minAmount) params.append('min_amount', currentFiltersToUse.minAmount);
    if (currentFiltersToUse.maxAmount) params.append('max_amount', currentFiltersToUse.maxAmount);
    currentFiltersToUse.ddsArticleIds?.forEach(id => params.append('dds_article_ids', id));
    params.append('skip', ((pageToFetch - 1) * ITEMS_PER_PAGE).toString());
    params.append('limit', ITEMS_PER_PAGE.toString());
    params.append('workspace_id', activeWorkspace.id); // Добавляем workspace_id

    try {
      const data = await apiService.get(`/transactions/?${params.toString()}`);
      setTransactions(data.items || []);
      setTotalTransactions(data.total_count || 0);
      setCurrentPage(pageToFetch);
    } catch (err) {
      console.error("TransactionsPage: Error in fetchTransactions:", err);
      if (err instanceof ApiError) {
        if (err.status === 401) {
            setError('Сессия истекла. Пожалуйста, войдите снова.');
            logout();
        } else {
            setError(err.message || 'Не удалось загрузить транзакции');
        }
      } else {
        setError('Произошла неизвестная ошибка при загрузке транзакций.');
      }
      setTransactions([]);
      setTotalTransactions(0);
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated, isAuthLoading, navigate, location.pathname, logout, activeWorkspace]);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const pageFromUrl = parseInt(params.get('page') || '1', 10);
    const currentFiltersFromUrl = {
        startDate: params.get('start_date') ? parseISO(params.get('start_date')) : null,
        endDate: params.get('end_date') ? parseISO(params.get('end_date')) : null,
        accountId: params.get('account_id') || '',
        ddsArticleIds: params.getAll('dds_article_ids') || [],
        minAmount: params.get('min_amount') || '',
        maxAmount: params.get('max_amount') || '',
    };

    setFilterStartDate(currentFiltersFromUrl.startDate);
    setFilterEndDate(currentFiltersFromUrl.endDate);
    setFilterAccountId(currentFiltersFromUrl.accountId);
    setFilterDdsArticleIds(currentFiltersFromUrl.ddsArticleIds.map(Number)); // Преобразуем в числа, если нужно
    setFilterMinAmount(currentFiltersFromUrl.minAmount);
    setFilterMaxAmount(currentFiltersFromUrl.maxAmount);

    if (!isAuthLoading && isAuthenticated && activeWorkspace) {
        fetchTransactions(pageFromUrl, currentFiltersFromUrl);
        fetchAccountsForFilter();
    }
  }, [location.search, isAuthLoading, isAuthenticated, activeWorkspace, fetchAccountsForFilter, fetchTransactions]);

  const handlePageChange = (newPage) => {
    const currentFilters = { startDate: filterStartDate, endDate: filterEndDate, accountId: filterAccountId, ddsArticleIds: filterDdsArticleIds, minAmount: filterMinAmount, maxAmount: filterMaxAmount };
    updateUrlWithParams(newPage, currentFilters);
  };

  const handleApplyFiltersAndResetPage = () => {
    const currentFilters = { startDate: filterStartDate, endDate: filterEndDate, accountId: filterAccountId, ddsArticleIds: filterDdsArticleIds, minAmount: filterMinAmount, maxAmount: filterMaxAmount };
    updateUrlWithParams(1, currentFilters);
  };

  const handleResetFiltersAndPage = () => {
    const emptyFilters = { startDate: null, endDate: null, accountId: '', ddsArticleIds: [], minAmount: '', maxAmount: '' };
    setFilterStartDate(null); setFilterEndDate(null);
    setFilterAccountId(''); setFilterMinAmount(''); setFilterMaxAmount('');
    setFilterDdsArticleIds([]);
    updateUrlWithParams(1, emptyFilters);
  };

  const getCurrentFilters = () => ({
    startDate: filterStartDate, endDate: filterEndDate, accountId: filterAccountId,
    ddsArticleIds: filterDdsArticleIds, minAmount: filterMinAmount, maxAmount: filterMaxAmount
  });

  const handleOpenCreateModal = (type) => setFormModalState({ isOpen: true, type: type, editingTransaction: null });
  const handleOpenEditModal = (transaction) => {
    if (!transaction || !transaction.dds_article) { setError("Не удалось определить тип операции для редактирования."); return; }
    const operationType = transaction.dds_article.article_type;
    setFormModalState({ isOpen: true, type: operationType, editingTransaction: transaction });
  };
  const handleCloseFormModal = () => setFormModalState({ isOpen: false, type: null, editingTransaction: null });

  const handleTransactionProcessedSuccess = () => {
    fetchTransactions(currentPage, getCurrentFilters());
    handleCloseFormModal();
  };
  const handleUploadSuccess = () => {
    setIsUploadModalOpen(false);
    fetchTransactions(1, getCurrentFilters());
  };
  const handleOpenDeleteConfirmModal = (transaction) => { setTransactionToDelete(transaction); setIsConfirmDeleteModalOpen(true); };
  const handleCloseDeleteConfirmModal = () => { setTransactionToDelete(null); setIsConfirmDeleteModalOpen(false); };

  const handleConfirmDeleteTransaction = async () => {
    if (!transactionToDelete) { return; }
    setError(null);
    try {
      const params = new URLSearchParams({ workspace_id: activeWorkspace.id });
      await apiService.delete(`/transactions/${transactionToDelete.id}?${params.toString()}`);
      const newTotal = totalTransactions - 1;
      const newTotalPages = Math.ceil(newTotal / ITEMS_PER_PAGE);
      const newPage = (transactions.length === 1 && currentPage > 1 && currentPage > newTotalPages) ? currentPage - 1 : currentPage;
      
      if (newPage !== currentPage) {
          updateUrlWithParams(newPage, getCurrentFilters());
      } else {
          fetchTransactions(newPage, getCurrentFilters());
      }

    } catch (err) {
      console.error("TransactionsPage: Ошибка удаления:", err);
      setError( (err instanceof ApiError ? err.message : null) || "Не удалось удалить транзакцию.");
    } finally {
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
        <Loader message="Проверка аутентификации..." />
      </div>
    );
  }

  // Футер для TransactionForm в Modal
  const transactionModalFooter = (
    <div className="flex justify-end space-x-3">
      <Button variant="secondary" size="md" onClick={handleCloseFormModal} disabled={isLoading}>
        Отмена
      </Button>
      <Button
        type="submit"
        variant="primary"
        size="md"
        form={TRANSACTION_FORM_ID} // Связываем кнопку с формой
        disabled={isLoading}
      >
        {isLoading ? 'Сохранение...' : (formModalState.editingTransaction ? 'Сохранить изменения' : (formModalState.type === 'income' ? "Добавить доход" : "Добавить расход"))}
      </Button>
    </div>
  );

  // Футер для StatementUploadModal (шаг 1)
  const statementUploadModalFooterStep1 = (
    <div className="flex justify-end space-x-3">
      <Button variant="secondary" size="md" onClick={() => setIsUploadModalOpen(false)} disabled={isLoading}>
        Отмена
      </Button>
      <Button
        type="submit"
        variant="primary"
        size="md"
        form={`${UPLOAD_MODAL_FORM_ID}-step1`} // Связываем кнопку с формой по ID для шага 1
        disabled={isLoading}
        iconLeft={!isLoading ? <ArrowUpTrayIcon className="h-5 w-5" /> : null}
      >
        {isLoading ? 'Обработка...' : 'Загрузить и обработать'}
      </Button>
    </div>
  );

  // Футер для StatementUploadModal (шаг 2)
  const statementUploadModalFooterStep2 = (
    <div className="flex justify-end space-x-3">
      <Button variant="secondary" size="md" onClick={() => setIsUploadModalOpen(false)} disabled={isLoading}>
        Отмена
      </Button>
      <Button
        type="submit"
        variant="success"
        size="md"
        form={`${UPLOAD_MODAL_FORM_ID}-step2`} // Связываем кнопку с формой по ID для шага 2
        disabled={isLoading}
        iconLeft={!isLoading ? <CheckCircleIcon className="h-5 w-5" /> : null}
      >
        {isLoading ? 'Сохранение...' : 'Сохранить классифицированные'}
      </Button>
    </div>
  );

const commonLabelClasses = "block text-sm font-medium text-gray-700 mb-1";
const commonInputClasses = "mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm h-10";
  const pageActions = (
    <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:gap-3 w-full sm:w-auto">
      <Button variant="success" onClick={() => handleOpenCreateModal('income')} disabled={!isAuthenticated || !activeWorkspace} iconLeft={<ArrowUpTrayIcon className="h-5 w-5" />} fullWidth className="sm:w-auto" size="md" > Добавить доход </Button>
      <Button variant="danger" onClick={() => handleOpenCreateModal('expense')} disabled={!isAuthenticated || !activeWorkspace} iconLeft={<AddExpenseIcon className="h-5 w-5" />} fullWidth className="sm:w-auto" size="md" > Добавить расход </Button>
      <Button variant="primary" onClick={() => setIsUploadModalOpen(true)} disabled={!isAuthenticated || !activeWorkspace} iconLeft={<UploadIcon className="h-5 w-5" />} fullWidth className="sm:w-auto bg-sky-600 hover:bg-sky-500 focus:ring-sky-500" size="md" > Загрузить выписку </Button>
    </div>
  );

  return (
    <>
      <PageTitle title="Транзакции" actions={pageActions} />

      {!isAuthLoading && !isAuthenticated && (
        <div className="text-center py-10">
            <Alert type="warning" title="Доступ запрещен" message={<>Пожалуйста, <Link to="/login" className="font-medium text-indigo-600 hover:underline">войдите в систему</Link> для просмотра транзакций.</>} />
        </div>
      )}

      {!activeWorkspace && !isLoading && isAuthenticated && (
        <EmptyState
            title="Рабочее пространство не выбрано"
            message="Пожалуйста, выберите рабочее пространство в шапке сайта, чтобы увидеть транзакции."
          />
      )}

      {isAuthenticated && activeWorkspace && (
      <>
        <div className="p-4 bg-white shadow-lg rounded-xl mb-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Фильтры</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:flex lg:flex-wrap lg:items-end lg:gap-x-4 gap-y-4">
            <div className="lg:flex-auto lg:min-w-[260px]">
              <label htmlFor="dateRange" className={commonLabelClasses}>Период</label>
              <DatePicker selectsRange={true} startDate={filterStartDate} endDate={filterEndDate} onChange={ (dates) => { const [start, end] = dates; setFilterStartDate(start); setFilterEndDate(end); }} isClearable={true} dateFormat="dd.MM.yyyy" placeholderText="Выберите диапазон дат" locale={ru} className={`${commonInputClasses} w-full`} wrapperClassName="w-full"/>
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
              <Button variant="primary" onClick={handleApplyFiltersAndResetPage} iconLeft={<FunnelIcon className="h-5 w-5" />} title="Применить фильтры" className="flex-1 lg:flex-none" size="md" >
                <span className="hidden sm:inline">Применить</span>
                <span className="sm:hidden">Применить</span>
              </Button>
              <Button variant="secondary" onClick={handleResetFiltersAndPage} iconLeft={<ArrowPathIcon className="h-5 w-5" />} title="Сбросить фильтры" className="flex-1 lg:flex-none" size="md" >
                <span className="hidden sm:inline">Сбросить</span>
                <span className="sm:hidden">Сбросить</span>
              </Button>
            </div>
          </div>
          {filterDdsArticleIds.length > 0 && (
            <div className="mt-4 col-span-1 sm:col-span-2 lg:col-span-full p-2 bg-indigo-50 border border-indigo-200 rounded-md text-sm text-indigo-700">
                Применен фильтр по статье ДДС ID: {filterDdsArticleIds.join(', ')}.
                <Button variant="link" size="sm" onClick={handleResetFiltersAndPage} className="ml-2 !p-0">Сбросить все фильтры</Button>
            </div>
          )}
          {error && !isLoading && transactions.length > 0 && (
            <Alert type="error" message={error} className="mt-4" />
          )}
        </div>

        {/* Модальное окно для TransactionForm */}
        <Modal 
          isOpen={formModalState.isOpen} 
          onClose={handleCloseFormModal} 
          title={formModalState.editingTransaction ? `Редактирование ID: ${formModalState.editingTransaction.id}` : (formModalState.type === 'income' ? "Добавить доход" : "Добавить расход")}
          formId={TRANSACTION_FORM_ID} // Передаем formId в Modal
          footer={transactionModalFooter} // Передаем футер с кнопками
        >
          <TransactionForm 
            onTransactionProcessed={handleTransactionProcessedSuccess} 
            transactionToEdit={formModalState.editingTransaction} 
            operationType={formModalState.type} 
            formId={TRANSACTION_FORM_ID} // Передаем formId в TransactionForm
            key={formModalState.isOpen ? `form-${formModalState.type}-${formModalState.editingTransaction?.id || 'create'}` : 'form-closed'}
            // onCancelEdit больше не нужен
          />
        </Modal>

        {/* Модальное окно для StatementUploadModal */}
        <Modal 
          isOpen={isUploadModalOpen} 
          onClose={() => setIsUploadModalOpen(false)} 
          title={"Загрузка выписки"} // StatementUploadModal сам управляет заголовком, но Modal тоже может иметь свой
          maxWidth="max-w-3xl"
          formId={UPLOAD_MODAL_FORM_ID} // Передаем formId в Modal
          footer={isUploadModalOpen && (isUploadModalOpen.step === 1 ? statementUploadModalFooterStep1 : statementUploadModalFooterStep2)} // Футер меняется в зависимости от шага
        >
          <StatementUploadModal 
            isOpen={isUploadModalOpen} // StatementUploadModal внутри себя использует isOpen для логики
            onClose={() => setIsUploadModalOpen(false)} 
            onUploadSuccess={handleUploadSuccess} 
            formId={UPLOAD_MODAL_FORM_ID} // Передаем formId в StatementUploadModal
          />
        </Modal>

        <ConfirmationModal isOpen={isConfirmDeleteModalOpen} onClose={handleCloseDeleteConfirmModal} title="Подтверждение удаления" message={`Вы уверены, что хотите удалить транзакцию: "${transactionToDelete?.description?.substring(0,30) || `ID: ${transactionToDelete?.id}`}"? Это действие отменит влияние операции на баланс счета.`} onConfirm={handleConfirmDeleteTransaction} confirmText="Удалить" cancelText="Отмена" confirmButtonVariant="danger" />

        <div className="mt-8">
          {isLoading && ( <Loader message="Загрузка операций..." containerClassName="text-center py-10" /> )}
          
          {!isLoading && error && transactions.length === 0 &&(
            <Alert type="error" title="Ошибка загрузки транзакций" message={error} className="my-4" />
          )}

          {!isLoading && !error && transactions.length === 0 && (
            <EmptyState icon={ListBulletIcon} title="Операций пока нет" message="Попробуйте изменить фильтры или добавьте первую операцию."
                actionButton={ <Button variant="primary" onClick={() => handleOpenCreateModal('expense')} iconLeft={<PlusIcon className="h-5 w-5"/>}> Добавить операцию </Button> }
            />
          )}

          {!isLoading && !error && transactions.length > 0 && (
            <>
              <div className="bg-white shadow-md rounded-lg">
                {/* Мобильные карточки */}
                <div className="sm:hidden divide-y divide-gray-200">
                {transactions.map((transaction) => (
                  <div key={transaction.id} className="p-4">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-sm font-medium text-gray-500"> {transaction.transaction_date ? format(parseISO(transaction.transaction_date), 'dd.MM.yy') : 'N/A'} </span>
                      <span className={`text-lg font-semibold ${transaction.dds_article?.article_type === 'income' ? 'text-green-600' : 'text-red-600'}`}> {transaction.dds_article?.article_type === 'income' ? '+' : '-'} {formatCurrency(transaction.amount, transaction.account?.currency)} </span>
                    </div>
                    <p className="text-sm text-gray-700 font-medium truncate" title={transaction.dds_article?.name || 'Статья не указана'}> <span className="text-gray-500">Статья: </span>{transaction.dds_article?.name || 'N/A'} </p>
                    <p className="text-sm text-gray-700 truncate" title={transaction.account?.name || 'Счет не указан'}> <span className="text-gray-500">Счет: </span>{transaction.account?.name || 'N/A'} </p>
                    {transaction.description && ( <p className="mt-1 text-xs text-gray-500 truncate" title={transaction.description}> <span className="text-gray-500">Описание: </span>{transaction.description} </p> )}
                    {transaction.created_by && ( <p className="mt-1 text-xs text-gray-500"> <span className="text-gray-500">Создал: </span>{transaction.created_by.full_name || transaction.created_by.username} </p> )}
                    <div className="mt-3 flex justify-end space-x-2">
                      <Button variant="icon" size="sm" onClick={() => handleOpenEditModal(transaction)} title="Редактировать транзакцию" className="text-blue-600 hover:text-blue-800 focus:ring-blue-500" > <PencilSquareIcon className="h-5 w-5"/> </Button>
                      <Button variant="icon" size="sm" onClick={() => handleOpenDeleteConfirmModal(transaction)} title="Удалить транзакцию" className="text-red-500 hover:text-red-700 focus:ring-red-500" > <TrashIcon className="h-5 w-5"/> </Button>
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
                        <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-6"> {transaction.transaction_date ? format(parseISO(transaction.transaction_date), 'dd.MM.yyyy') : 'N/A'} </td>
                        <td className={`whitespace-nowrap px-3 py-4 text-sm font-medium ${ transaction.dds_article?.article_type === 'income' ? 'text-green-600' : 'text-red-600' }`}> {transaction.dds_article?.article_type === 'income' ? '+' : '-'} {formatCurrency(transaction.amount, transaction.account?.currency)} </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">{transaction.account?.name || 'N/A'}</td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">{transaction.dds_article?.name || 'N/A'}</td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500 max-w-xs truncate" title={transaction.description}> {transaction.description || ''} </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500"> {transaction.created_by ? (transaction.created_by.full_name || transaction.created_by.username) : 'N/A'} </td>
                        <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6 space-x-1">
                          <Button variant="icon" size="sm" onClick={() => handleOpenEditModal(transaction)} title="Редактировать транзакцию" className="text-indigo-600 hover:text-indigo-900 focus:ring-indigo-500" > <PencilSquareIcon className="h-5 w-5"/> </Button>
                          <Button variant="icon" size="sm" onClick={() => handleOpenDeleteConfirmModal(transaction)} title="Удалить транзакцию" className="text-red-600 hover:text-red-800 focus:ring-red-500" > <TrashIcon className="h-5 w-5"/> </Button>
                        </td>
                      </tr>
                    ))}
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
            </>
          )}
        </div>
      </>
      )}
    </>
  );
};

export default TransactionsPage;