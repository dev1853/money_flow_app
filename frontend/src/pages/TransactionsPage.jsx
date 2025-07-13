// frontend/src/pages/TransactionsPage.jsx

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
    counterparty_id: 'all', // ИСПРАВЛЕНО: Добавлен фильтр по контрагенту
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
    const { activeWorkspace, accounts, ddsArticles, fetchDataForWorkspace } = useAuth();
    const [formType, setFormType] = React.useState('expense');

    const [currentPage, setCurrentPage] = useState(1);
    const [filters, dispatchFilters] = useReducer(filtersReducer, initialFilters);
    
    const [isFormModalOpen, setFormModalOpen] = useState(false);
    const [editingTransaction, setEditingTransaction] = useState(null);
    const [isUploadModalOpen, setUploadModalOpen] = useState(false);
    const [transactionToDelete, setTransactionToDelete] = useState(null);

    // ИСПРАВЛЕНО: Добавлен стейт для контрагентов для фильтра
    const [counterparties, setCounterparties] = useState([]); 

    // ИСПРАВЛЕНО: Загрузка контрагентов для фильтра
    useEffect(() => {
        const loadCounterparties = async () => {
            if (activeWorkspace?.id) {
                try {
                    const fetchedCounterparties = await apiService.getCounterparties({
                        workspace_id: activeWorkspace.id
                    });
                    // Убедитесь, что apiService.getCounterparties возвращает { items: [], total: 0 }
                    setCounterparties(fetchedCounterparties?.items || []); 
                } catch (err) {
                    console.error("Ошибка загрузки контрагентов для фильтра:", err);
                }
            }
        };
        loadCounterparties();
    }, [activeWorkspace]);

    const fetchTransactions = useCallback(async () => {
        const params = {
            page: currentPage,
            size: ITEMS_PER_PAGE,
            start_date: filters.start_date ? format(filters.start_date, 'yyyy-MM-dd') : undefined,
            end_date: filters.end_date ? format(filters.end_date, 'yyyy-MM-dd') : undefined,
            amount_from: filters.amount_from ? parseFloat(filters.amount_from) : undefined,
            amount_to: filters.amount_to ? parseFloat(filters.amount_to) : undefined,
        };
        if (filters.account_id && filters.account_id !== 'all') {
            params.account_id = filters.account_id;
        }
        // ИСПРАВЛЕНО: Добавляем counterparty_id в параметры запроса
        if (filters.counterparty_id && filters.counterparty_id !== 'all') {
            params.counterparty_id = filters.counterparty_id;
        }
        return apiService.getTransactions(params);
    }, [currentPage, filters]);

    const { data: transactionsData, loading, error, refetch: refetchTransactions } = useDataFetching(
        fetchTransactions,
        [fetchTransactions, activeWorkspace],
        { skip: !activeWorkspace }
    );
    console.log("TransactionsPage: Получены данные транзакций ->", transactionsData);

    console.log("TransactionsPage: Accounts ->", accounts); 
    console.log("TransactionsPage: DdsArticles ->", ddsArticles); 


    const transactionMutationFn = (transactionData) => {
        if (editingTransaction) {
            return apiService.updateTransaction(editingTransaction.id, transactionData);
        }
        return apiService.createTransaction(transactionData);
    };

    const [submitTransaction, { isLoading: isSubmitting, error: submissionError }] = useApiMutation(transactionMutationFn, {
        onSuccess: (data) => {
            console.log("TransactionsPage (useApiMutation onSuccess): Мутация успешна! Ответ сервера ->", data);
            handleResetFilters();
            if (activeWorkspace) {
                fetchDataForWorkspace(activeWorkspace.id);
            }
            console.log("TransactionsPage (useApiMutation onSuccess): Вызываю handleCloseFormModal...");
            handleCloseFormModal();
            console.log("TransactionsPage (useApiMutation onSuccess): Вызываю refetchTransactions...");
            refetchTransactions();
            console.log("TransactionsPage (useApiMutation onSuccess): Все действия по успеху вызваны.");
        }
    });

    const handleCloseFormModal = () => {
        setFormModalOpen(false);
        setEditingTransaction(null);
        console.log("TransactionsPage: handleCloseFormModal вызван, isFormModalOpen ->", false);
    };

    const handleTransactionSubmit = (transactionData) => {
        console.log("TransactionsPage: Вызов мутации с данными ->", transactionData);
        submitTransaction(transactionData);
    };

    const [deleteTransaction, { isLoading: isDeleting }] = useApiMutation(
        (id) => apiService.deleteTransaction(id),
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

    // ИСПРАВЛЕНО: Добавлены accessor или render для каждого столбца
    const columns = useMemo(() => [
        { 
            key: 'status', 
            label: '', 
            className: 'w-12 text-center',
            render: (row) => row.status 
        },
        { 
            key: 'date', 
            label: 'Дата', 
            className: 'w-24', 
            accessor: 'date' 
        },
        { 
            key: 'account', 
            label: 'Счет', 
            className: 'w-32', 
            accessor: 'account' 
        },
        { 
            key: 'amount', 
            label: 'Сумма', 
            className: 'w-28 text-right',
            render: (row) => row.amount 
        },
        { 
            key: 'description', 
            label: 'Описание', 
            className: 'flex-grow', 
            accessor: 'description' 
        },
        { // ИСПРАВЛЕНО: Колонка "Контрагент"
            key: 'counterparty', 
            label: 'Контрагент', 
            className: 'w-40', 
            accessor: 'counterparty.name', // Предполагается, что данные приходят вложенно
            render: (row) => row.counterparty?.name || 'Без контрагента'
        },
        { // ИСПРАВЛЕНО: Колонка "Договор"
            key: 'contract', 
            label: 'Договор', 
            className: 'w-40', 
            accessor: 'contract.name', // Предполагается, что данные приходят вложенно
            render: (row) => row.contract?.name || 'Без договора'
        },
        { 
            key: 'dds_article', 
            label: 'Статья ДДС', 
            className: 'w-48', 
            accessor: 'dds_article' 
        },
        { 
            key: 'actions', 
            label: 'Действия', 
            className: 'w-28 text-center',
            render: (row) => row.actions 
        }
    ], []);

    const tableData = useMemo(() => {
        const flatDdsArticles = flattenDdsArticles(ddsArticles || []); 
        console.log("TransactionsPage: Сглаженные DDS Articles ->", flatDdsArticles);

        return (transactionsData?.items || []).map(item => { 
            const isIncome = item.transaction_type === 'INCOME';
            const amountColor = isIncome ? 'text-green-600' : 'text-red-600';
            const amountPrefix = isIncome ? '+' : '-';
            const StatusIcon = isIncome ? ArrowUpCircleIcon : ArrowDownCircleIcon;
            
            const account = accounts.find(acc => acc.id === item.from_account_id || acc.id === item.to_account_id);
            const ddsArticle = flatDdsArticles.find(art => art.id === item.dds_article_id); 

            return {
                ...item,
                status: <StatusIcon className={`h-6 w-6 mx-auto ${amountColor}`} />,
                date: item.transaction_date && isValid(parseISO(item.transaction_date)) ? format(parseISO(item.transaction_date), 'dd.MM.yyyy') : 'Н/Д',
                account: account ? account.name : 'Неизвестный счет',
                dds_article: item.dds_article_id && ddsArticle ? ddsArticle.name : 'Без статьи', 
                amount: (
                    <span className={`font-medium ${amountColor}`}>
                        {amountPrefix} {item.amount} {account?.currency || ''}
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
    }, [transactionsData, accounts, ddsArticles, handleOpenFormModal, handleDeleteRequest]); 

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
                counterparties={counterparties || []} // ИСПРАВЛЕНО: Передаем контрагентов в фильтры
                onFilterChange={handleFilterChange}
                onResetFilters={handleResetFilters}
            />

            {error && <Alert type="error" className="my-4">{error}</Alert>}
            
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