// /frontend/src/pages/TransactionsPage.jsx

import React, { useState, useEffect, useCallback, useReducer, useMemo } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { apiService } from '../services/apiService';
import { format, parseISO, isValid } from 'date-fns';
import { ru } from 'date-fns/locale';

// Импорт хуков и компонентов
import { useDataFetching } from '../hooks/useDataFetching';
import { useApiMutation } from '../hooks/useApiMutation';
import PageTitle from '../components/PageTitle';
import Button from '../components/Button';
import Loader from '../components/Loader';
import Alert from '../components/Alert';
import Pagination from '../components/Pagination';
import Modal from '../components/Modal';
import TransactionForm from '../components/forms/TransactionForm';
import ConfirmationModal from '../components/ConfirmationModal';
import StatementUploadModal from '../components/StatementUploadModal'; 
import TransactionFilters from '../components/TransactionFilters';
import UniversalTable from '../components/UniversalTable'; 
import { ArrowUpCircleIcon, ArrowDownCircleIcon, PencilSquareIcon, TrashIcon, PlusIcon, ArrowUpOnSquareIcon } from '@heroicons/react/24/solid';
import { flattenDdsArticles } from '../utils/articleUtils'; 

const ITEMS_PER_PAGE = 20;

const initialFilters = {
    start_date: null,
    end_date: null,
    account_id: 'all',
    counterparty_id: 'all',
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
    // --- ИСПРАВЛЕНИЕ 1: Получаем activeWorkspace и authLoading из useAuth ---
    const { activeWorkspace, accounts, ddsArticles, fetchDataForWorkspace, loading: authLoading } = useAuth();
    const workspaceId = activeWorkspace?.id; // Безопасно извлекаем ID

    const [formType, setFormType] = React.useState('expense');
    const [currentPage, setCurrentPage] = useState(1);
    const [filters, dispatchFilters] = useReducer(filtersReducer, initialFilters);
    
    const [isFormModalOpen, setFormModalOpen] = useState(false);
    const [editingTransaction, setEditingTransaction] = useState(null);
    const [isUploadModalOpen, setUploadModalOpen] = useState(false);
    const [transactionToDelete, setTransactionToDelete] = useState(null);
    const [counterparties, setCounterparties] = useState([]); 

    useEffect(() => {
        const loadCounterparties = async () => {
            if (workspaceId) { // Используем workspaceId для проверки
                try {
                    const fetchedCounterparties = await apiService.getCounterparties({
                        workspace_id: workspaceId
                    });
                    setCounterparties(fetchedCounterparties?.items || []); 
                } catch (err) {
                    console.error("Ошибка загрузки контрагентов для фильтра:", err);
                }
            }
        };
        loadCounterparties();
    }, [workspaceId]); // Зависимость от workspaceId

    // --- ИСПРАВЛЕНИЕ 2: Обновляем функцию загрузки транзакций ---
    const fetchTransactions = useCallback(async () => {
        if (!workspaceId) return null; // Защита от вызова без ID

        const params = {
            workspace_id: workspaceId, // Явно добавляем ID рабочего пространства
            page: currentPage,
            size: ITEMS_PER_PAGE,
            start_date: filters.start_date ? format(filters.start_date, 'yyyy-MM-dd') : undefined,
            end_date: filters.end_date ? format(filters.end_date, 'yyyy-MM-dd') : undefined,
        };
        if (filters.account_id && filters.account_id !== 'all') {
            params.account_id = filters.account_id;
        }
        if (filters.counterparty_id && filters.counterparty_id !== 'all') {
            params.counterparty_id = filters.counterparty_id;
        }
        if (filters.amount_from !== '') {
            params.amount_from = parseFloat(filters.amount_from);
        }
        if (filters.amount_to !== '') {
            params.amount_to = parseFloat(filters.amount_to);
        }
        console.log('Фильтры для запроса:', params);
        return apiService.getTransactions(params);
    }, [currentPage, filters, workspaceId]); // Добавляем workspaceId в зависимости

    // --- ИСПРАВЛЕНИЕ 3: Обновляем хук useDataFetching ---
    const { 
        data: transactionsData, 
        loading, 
        error, 
        refetch: refetchTransactions 
    } = useDataFetching(
        fetchTransactions,
        [workspaceId, currentPage, filters], // Массив зависимостей теперь включает workspaceId
        { skip: authLoading || !workspaceId } // Пропускаем запрос, пока нет ID или идет загрузка контекста
    );

    const transactionMutationFn = (transactionData) => {
        if (editingTransaction) {
            return apiService.updateTransaction(editingTransaction.id, transactionData, { workspace_id: activeWorkspace?.id });
        }
        return apiService.createTransaction(transactionData, { workspace_id: activeWorkspace?.id });
    };

    const [submitTransaction, { isLoading: isSubmitting, error: submissionError }] = useApiMutation(transactionMutationFn, {
        onSuccess: () => {
            handleResetFilters();
            if (activeWorkspace) {
                fetchDataForWorkspace(activeWorkspace.id);
            }
            handleCloseFormModal();
            refetchTransactions();
        }
    });

    const handleCloseFormModal = () => {
        setFormModalOpen(false);
        setEditingTransaction(null);
    };

    const handleTransactionSubmit = (transactionData) => {
        submitTransaction(transactionData);
    };

    const [deleteTransaction, { isLoading: isDeleting }] = useApiMutation(
        (id) => apiService.deleteTransaction(id, { workspace_id: activeWorkspace?.id }),
        {
            onSuccess: () => {
                refetchTransactions();
                if (activeWorkspace) {
                    fetchDataForWorkspace(activeWorkspace.id);
                }
                setTransactionToDelete(null);
            }
        }
    );
    
    const handleConfirmDelete = async () => {
        if (transactionToDelete) {
            await deleteTransaction(transactionToDelete.id);
        }
    };
    
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

    const handleDeleteRequest = (transaction) => {
        setTransactionToDelete(transaction);
    };

    const columns = useMemo(() => [
        {
            key: 'transaction_type',
            label: 'ТИП',
            render: row =>
                row.transaction_type === 'INCOME' ? (
                    <span className="flex items-center text-green-600">
                        <ArrowUpCircleIcon className="h-5 w-5 mr-1" /> 
                    </span>
                ) : (
                    <span className="flex items-center text-red-600">
                        <ArrowDownCircleIcon className="h-5 w-5 mr-1" /> 
                    </span>
                ),
        },
        {
            key: 'transaction_date',
            label: 'Дата',
            render: row => row.transaction_date ? new Date(row.transaction_date).toLocaleDateString('ru-RU') : '',
        },
        {
            key: 'account_name',
            label: 'Счет',
            render: row => row.account_name || '',
        },
        {
            key: 'amount',
            label: 'Сумма',
            render: row =>
                <span className={row.transaction_type === 'INCOME' ? 'text-green-600' : 'text-red-600'}>
                    {row.amount ? row.amount.toLocaleString('ru-RU', { style: 'currency', currency: 'RUB' }) : ''}
                </span>,
        },
        {
            key: 'dds_article_name',
            label: 'Статья',
            render: row => row.dds_article_name || '',
        },
        { key: 'description', label: 'Описание' },
        {
            key: 'contractor',
            label: 'Контрагент',
            render: row => row.contractor || '', 
        },
        {
            key: 'contract',
            label: 'Договор',
            render: row => row.contract || '',
        },
        {
            key: 'actions',
            label: 'Действия',
            render: row => (
                <div className="flex gap-2">
                    <button
                        className="text-blue-600 hover:text-blue-800"
                        title="Редактировать"
                        onClick={() => handleOpenFormModal(row)}
                    >
                        <PencilSquareIcon className="h-5 w-5" />
                    </button>
                    <button
                        className="text-red-600 hover:text-red-800"
                        title="Удалить"
                        onClick={() => handleDeleteRequest(row)}
                    >
                        <TrashIcon className="h-5 w-5" />
                    </button>
                </div>
            ),
        },
    ], [handleOpenFormModal, handleDeleteRequest]);

    const tableData = useMemo(() => {
        const items = Array.isArray(transactionsData) ? transactionsData : (transactionsData?.items || []);
        return items.map(item => ({
            ...item,
            contractor: item.counterparty?.name || '',
            contract: item.contract?.name || '',
            dds_article_name: item.dds_article?.name || '',
        }));
    }, [transactionsData]); 

    // Отображаем главный лоадер, если контекст еще не загрузился
    if (authLoading) {
        return <Loader text="Инициализация..." />;
    }

    return (
        <React.Fragment>
            {/* Ваш JSX без изменений */}
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
                counterparties={counterparties || []}
                onFilterChange={handleFilterChange}
                onResetFilters={handleResetFilters}
            />

            {error && <Alert type="error" className="my-4">{error.message}</Alert>}
            
            <UniversalTable columns={columns} data={tableData} loading={loading} emptyMessage="Нет транзакций по выбранным фильтрам." />
            
            <Pagination
                currentPage={currentPage}
                totalPages={Math.ceil((transactionsData?.total || 0) / ITEMS_PER_PAGE)} 
                onPageChange={setCurrentPage}
            />
            
            <Modal isOpen={isFormModalOpen} onClose={handleCloseFormModal} title={editingTransaction ? 'Редактировать транзакцию' : 'Новая транзакция'}>
                <TransactionForm
                    transaction={editingTransaction}
                    onSubmit={handleTransactionSubmit}
                    onCancel={handleCloseFormModal}
                    accounts={accounts || []}
                    defaultType={formType}
                    isSubmitting={isSubmitting}
                    error={submissionError}
                    workspaceId={workspaceId}
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