// frontend/src/pages/TransactionsPage.jsx

import React, { useState, useEffect, useCallback, useReducer, useMemo } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { apiService } from '../services/apiService';
import { format, parseISO, isValid } from 'date-fns';
import { useDataFetching } from '../hooks/useDataFetching';
import { useApiMutation } from '../hooks/useApiMutation';

// Импорт UI компонентов
import PageTitle from '../components/PageTitle';
import Button from '../components/Button';
import Loader from '../components/Loader';
import Alert from '../components/Alert';
import Pagination from '../components/Pagination';
import Modal from '../components/Modal';
import TransactionForm from '../components/TransactionForm';
import ConfirmationModal from '../components/ConfirmationModal';
import StatementUploadModal from '../components/StatementUploadModal'; 
import TransactionFilters from '../components/TransactionFilters';
import UniversalTable from '../components/UniversalTable'; 
import { ArrowUpCircleIcon, ArrowDownCircleIcon, PencilSquareIcon, TrashIcon, PlusIcon, ArrowUpOnSquareIcon } from '@heroicons/react/24/solid';

const ITEMS_PER_PAGE = 20;

const initialFilters = {
    start_date: null,
    end_date: null,
    account_id: 'all',
    contractor: '',
    amount_from: '',
    amount_to: '',
};

function filtersReducer(state, action) {
    switch (action.type) {
        case 'SET_FILTER':
            return { ...state, [action.filterName]: action.value };
        case 'RESET_FILTERS':
            return initialFilters;
        default:
            return state;
    }
}

function TransactionsPage() {
    const { activeWorkspace, isWorkspaceLoaded, accounts, ddsArticles, fetchAccounts } = useAuth();
    
    const [currentPage, setCurrentPage] = useState(1);
    const [filters, dispatchFilters] = useReducer(filtersReducer, initialFilters);
    
    // Состояния для модальных окон
    const [isFormModalOpen, setFormModalOpen] = useState(false);
    const [editingTransaction, setEditingTransaction] = useState(null);
    const [isUploadModalOpen, setUploadModalOpen] = useState(false);
    const [transactionToDelete, setTransactionToDelete] = useState(null);

    // Загрузка транзакций с помощью нашего хука
    const fetchTransactions = useCallback(async () => {
        const params = {
            workspace_id: activeWorkspace.id,
            page: currentPage,
            size: ITEMS_PER_PAGE,
            start_date: filters.start_date ? format(filters.start_date, 'yyyy-MM-dd') : undefined,
            end_date: filters.end_date ? format(filters.end_date, 'yyyy-MM-dd') : undefined,
            account_id: filters.account_id,
            contractor: filters.contractor,
            amount_from: filters.amount_from,
            amount_to: filters.amount_to,
        };
        return apiService.getTransactions(params);
    }, [activeWorkspace?.id, currentPage, filters]); // Зависимости для useCallback остаются здесь

    // 2. Вызываем useDataFetching с ПРАВИЛЬНЫМИ тремя аргументами
    const { data: transactionsData, loading, error, refetch: refetchTransactions } = useDataFetching(
        fetchTransactions,
        [fetchTransactions], // Зависимость для хука - это сама функция, которая изменится, когда изменятся ее зависимости
        { skip: !isWorkspaceLoaded }
    );

    // Логика для создания и обновления транзакций через хук
    const transactionMutationFn = async (transactionData) => {
        if (editingTransaction) {
            return apiService.updateTransaction(editingTransaction.id, transactionData);
        } else {
            return apiService.createTransaction(transactionData);
        }
    };

    const [submitTransaction, isSubmitting, submissionError] = useApiMutation(transactionMutationFn, {
        onSuccess: () => {
            refetchTransactions();
            fetchAccounts(activeWorkspace.id);
            handleCloseFormModal();
        }
    });

    const handleTransactionSubmit = (transactionData) => {
        submitTransaction(transactionData);
    };

    // Логика для удаления
    const [deleteTransaction, isDeleting] = useApiMutation(
        (id) => apiService.deleteTransaction(id),
        {
            onSuccess: () => {
                refetchTransactions();
                fetchAccounts(activeWorkspace.id);
                setTransactionToDelete(null);
            }
        }
    );
    
    const handleConfirmDelete = async () => {
        if (transactionToDelete) {
            await deleteTransaction(transactionToDelete.id);
        }
    };
    
    // Обработчики UI
    const handleFilterChange = useCallback((filterName, value) => {
        dispatchFilters({ type: 'SET_FILTER', filterName, value });
        setCurrentPage(1);
    }, []);
    const handleResetFilters = useCallback(() => {
        dispatchFilters({ type: 'RESET_FILTERS' });
        setCurrentPage(1);
    }, []);
    const handleOpenFormModal = (transaction = null) => {
        setEditingTransaction(transaction);
        setFormModalOpen(true);
    };
    const handleCloseFormModal = () => {
        setFormModalOpen(false);
        setEditingTransaction(null);
    };
    const handleDeleteRequest = (transaction) => {
        setTransactionToDelete(transaction);
    };


    // Подготовка данных для таблицы
    const headers = useMemo(() => [
        { key: 'status', label: '', className: 'w-12 text-center' },
        { key: 'date', label: 'Дата', className: 'w-24' },
        { key: 'account', label: 'Счет', className: 'w-32' },
        { key: 'amount', label: 'Сумма', className: 'w-28 text-right' },
        { key: 'description', label: 'Описание', className: 'flex-grow' },
        { key: 'dds_article', label: 'Статья ДДС', className: 'w-48' },
        { key: 'actions', label: 'Действия', className: 'w-28 text-center' }
    ], []);

    const tableData = useMemo(() => {
        return (transactionsData?.items || []).map(item => {
            const isIncome = item.dds_article?.article_type === 'income' || item.transaction_type === 'income';
            const amountColor = isIncome ? 'text-green-600' : 'text-red-600';
            const amountPrefix = isIncome ? '+' : '-';
            const StatusIcon = isIncome ? ArrowUpCircleIcon : ArrowDownCircleIcon;

            return {
                ...item,
                status: <StatusIcon className={`h-6 w-6 mx-auto ${amountColor}`} />,
                date: item.transaction_date && isValid(parseISO(item.transaction_date)) ? format(parseISO(item.transaction_date), 'dd.MM.yyyy') : 'Н/Д',
                account: item.account?.name,
                dds_article: item.dds_article ? item.dds_article.name : 'Без статьи',
                amount: (
                    <span className={`font-medium ${amountColor}`}>
                        {amountPrefix} {item.amount} {item.account?.currency || ''}
                    </span>
                ),
                actions: (
                    <div className="flex justify-end space-x-2">
                        <Button variant="icon" onClick={() => handleOpenFormModal(item)}><PencilSquareIcon className="h-5 w-5"/></Button>
                        <Button variant="icon" onClick={() => handleDeleteRequest(item)} className="text-red-600 hover:text-red-800"><TrashIcon className="h-5 w-5"/></Button>
                    </div>
                )
            };
        });
    }, [transactionsData]);

    return (
        <React.Fragment>
            <div className="flex justify-between items-center mb-4 flex-wrap gap-2">
                <PageTitle title="Транзакции" />
                <div className="flex items-center space-x-2">
                    <Button variant="secondary" onClick={() => setUploadModalOpen(true)}>
                        <ArrowUpOnSquareIcon className="h-5 w-5 mr-2" />
                        Импорт
                    </Button>
                    <Button onClick={() => handleOpenFormModal()} className="bg-lime-600 hover:bg-lime-700 text-white">
                        <PlusIcon className="h-5 w-5 mr-2" />
                        Добавить
                    </Button>
                </div>
            </div>

            <TransactionFilters
                filters={filters}
                accounts={accounts || []}
                onFilterChange={handleFilterChange}
                onResetFilters={handleResetFilters}
            />

            {error && <Alert type="error" className="my-4">{error}</Alert>}
            
            <UniversalTable headers={headers} data={tableData} loading={loading} emptyMessage="Нет транзакций по выбранным фильтрам." />
            
            <Pagination
                currentPage={currentPage}
                totalPages={Math.ceil((transactionsData?.total_count || 0) / ITEMS_PER_PAGE)}
                onPageChange={setCurrentPage}
            />
            
            <Modal isOpen={isFormModalOpen} onClose={handleCloseFormModal} title={editingTransaction ? 'Редактировать транзакцию' : 'Новая транзакция'}>
                <TransactionForm
                    transaction={editingTransaction}
                    onSubmit={handleTransactionSubmit}
                    onCancel={handleCloseFormModal}
                    accounts={accounts || []}
                    ddsArticles={ddsArticles || []}
                    isSubmitting={isSubmitting}
                    error={submissionError}
                />
            </Modal>
            
            <StatementUploadModal isOpen={isUploadModalOpen} onClose={() => setUploadModalOpen(false)} onSuccess={() => refetchTransactions()} />
            
            <ConfirmationModal
                isOpen={Boolean(transactionToDelete)}
                onClose={() => setTransactionToDelete(null)}
                onConfirm={handleConfirmDelete}
                title="Удалить транзакцию"
                message="Вы уверены, что хотите удалить эту транзакцию?"
                loading={isDeleting}
            />
        </React.Fragment>
    );
}

export default TransactionsPage;