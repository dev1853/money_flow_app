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

// *** НОВАЯ (ИЛИ ПЕРЕНЕСЕННАЯ) ВСПОМОГАТЕЛЬНАЯ ФУНКЦИЯ ДЛЯ СГЛАЖИВАНИЯ СТАТЕЙ ***
// Эту функцию можно вынести в отдельный файл utils/articleUtils.js, если она используется в нескольких местах.
const flattenDdsArticles = (articles) => {
    let flatList = [];
    articles.forEach(article => {
        // Добавляем только статьи, которые не являются группами
        if (article.article_type !== 'group') {
            flatList.push(article);
        }
        // Рекурсивно добавляем дочерние элементы
        if (article.children && article.children.length > 0) {
            flatList = flatList.concat(flattenDdsArticles(article.children));
        }
    });
    return flatList;
};


function TransactionsPage() {
    const { activeWorkspace, accounts, ddsArticles, fetchDataForWorkspace } = useAuth();
    const [formType, setFormType] = React.useState('expense');

    const [currentPage, setCurrentPage] = useState(1);
    const [filters, dispatchFilters] = useReducer(filtersReducer, initialFilters);
    
    const [isFormModalOpen, setFormModalOpen] = useState(false);
    const [editingTransaction, setEditingTransaction] = useState(null);
    const [isUploadModalOpen, setUploadModalOpen] = useState(false);
    const [transactionToDelete, setTransactionToDelete] = useState(null);

    const fetchTransactions = useCallback(async () => {
        const params = {
            page: currentPage,
            size: ITEMS_PER_PAGE,
            start_date: filters.start_date ? format(filters.start_date, 'yyyy-MM-dd') : undefined,
            end_date: filters.end_date ? format(filters.end_date, 'yyyy-MM-dd') : undefined,
        };
        if (filters.account_id && filters.account_id !== 'all') {
            params.account_id = filters.account_id;
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
    console.log("TransactionsPage: DdsArticles ->", ddsArticles); // Это исходные, вложенные статьи


    const transactionMutationFn = (transactionData) => {
        if (editingTransaction) {
            return apiService.updateTransaction(editingTransaction.id, transactionData);
        }
        return apiService.createTransaction(transactionData);
    };

    const [submitTransaction, { isLoading: isSubmitting, error: submissionError }] = useApiMutation(transactionMutationFn, {
        onSuccess: (data) => { 
            console.log("TransactionsPage: Мутация успешна! Ответ сервера ->", data); 

            handleResetFilters(); 
            
            if (activeWorkspace) {
                fetchDataForWorkspace(activeWorkspace.id);
            }
            
            handleCloseFormModal();

            refetchTransactions(); 
        }
    });

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
    const handleCloseFormModal = () => {
        setFormModalOpen(false);
        setEditingTransaction(null);
        console.log("TransactionsPage: handleCloseFormModal вызван, isFormModalOpen ->", false); 
    };
    const handleDeleteRequest = (transaction) => {
        setTransactionToDelete(transaction);
    };

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
        // *** ИСПРАВЛЕНИЕ ЗДЕСЬ: Сглаживаем ddsArticles перед использованием ***
        const flatDdsArticles = flattenDdsArticles(ddsArticles || []); 
        // Добавьте console.log для отладки:
        console.log("TransactionsPage: Сглаженные DDS Articles ->", flatDdsArticles);

        // ИСПРАВЛЕНИЕ: Используем transactionsData?.items вместо transactionsData?.transactions
        return (transactionsData?.items || []).map(item => { //
            const isIncome = item.transaction_type === 'INCOME';
            const amountColor = isIncome ? 'text-green-600' : 'text-red-600';
            const amountPrefix = isIncome ? '+' : '-';
            const StatusIcon = isIncome ? ArrowUpCircleIcon : ArrowDownCircleIcon;
            
            const account = accounts.find(acc => acc.id === item.from_account_id || acc.id === item.to_account_id);
            // *** ИСПРАВЛЕНО: Теперь ищем статью в сглаженном списке ***
            const ddsArticle = flatDdsArticles.find(art => art.id === item.dds_article_id); 

            return {
                ...item,
                status: <StatusIcon className={`h-6 w-6 mx-auto ${amountColor}`} />,
                date: item.transaction_date && isValid(parseISO(item.transaction_date)) ? format(parseISO(item.transaction_date), 'dd.MM.yyyy') : 'Н/Д',
                account: account ? account.name : 'Неизвестный счет',
                // *** ИСПРАВЛЕНО: Убедимся, что dds_article_id не null, прежде чем искать статью ***
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
    }, [transactionsData, accounts, ddsArticles]); // ddsArticles - зависимость для useMemo

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
                // ИСПРАВЛЕНИЕ: Используем transactionsData?.total вместо transactionsData?.total_count
                totalPages={Math.ceil((transactionsData?.total || 0) / ITEMS_PER_PAGE)} //
                onPageChange={setCurrentPage}
            />
            
            <Modal isOpen={isFormModalOpen} onClose={handleCloseFormModal} title={editingTransaction ? 'Редактировать транзакцию' : 'Новая транзакция'}>
                <TransactionForm
                    transaction={editingTransaction}
                    onSubmit={handleTransactionSubmit}
                    onCancel={handleCloseFormModal}
                    accounts={accounts || []}
                    articles={ddsArticles || []} 
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