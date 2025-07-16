import React, { useEffect, useState, useMemo } from 'react';
import { apiService } from '../services/apiService';
import { useAuth } from '../contexts/AuthContext';
import { format, parseISO } from 'date-fns';
import { formatCurrency } from '../utils/formatting';

import Loader from './Loader';
import Alert from './Alert';
import UniversalTable from './UniversalTable';
import Pagination from './Pagination';

const TransactionsListForDdsArticle = ({ articleId, articleName, startDate, endDate, onClose }) => {
  const { activeWorkspace } = useAuth();
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0); // Added for Pagination
  const itemsPerPage = 10;

  useEffect(() => {
    const fetchTransactions = async () => {
      if (!activeWorkspace || !articleId) {
        setLoading(false);
        return;
      }
      setLoading(true);
      setError(null);
      try {
        const params = {
          workspace_id: activeWorkspace.id,
          dds_article_id: articleId,
          start_date: startDate ? format(startDate, 'yyyy-MM-dd') : undefined,
          end_date: endDate ? format(endDate, 'yyyy-MM-dd') : undefined,
          skip: (currentPage - 1) * itemsPerPage,
          limit: itemsPerPage,
        };
        const response = await apiService.getTransactions(params);
        setTransactions(Array.isArray(response.items) ? response.items : []);
        setTotalItems(response.total_count || 0);
        setTotalPages(Math.ceil((response.total_count || 0) / itemsPerPage));
      } catch (err) {
        setError(err.message || "Ошибка при загрузке транзакций.");
      } finally {
        setLoading(false);
      }
    };
    fetchTransactions();
  }, [activeWorkspace, articleId, currentPage, startDate, endDate]);

  // useMemo for columns to prevent re-creation on every render
  const columns = useMemo(() => [
    { key: 'transaction_date', label: 'Дата', render: (row) => {
        if (typeof row.transaction_date === 'string') {
          return format(parseISO(row.transaction_date), 'dd.MM.yyyy');
        }
        return '—';
      }
    },
    { key: 'description', label: 'Описание', className: 'flex-grow' },
    { 
      key: 'amount', 
      label: 'Сумма', 
      className: 'text-right',
      render: (row) => {
        // 1. Adapt amount color based on transaction type
        const isIncome = row.transaction_type === 'INCOME';
        const amountColor = isIncome 
            ? 'text-green-600 dark:text-green-400' 
            : 'text-red-600 dark:text-red-400';
        // Transfers can have a neutral color
        if (row.transaction_type === 'TRANSFER') {
            return <span className="text-gray-700 dark:text-gray-300">{formatCurrency(row.amount, row.currency)}</span>
        }
        return <span className={amountColor}>{formatCurrency(row.amount, row.currency)}</span>
      }
    },
    { key: 'from_account', label: 'Со счета', render: (row) => row.from_account?.name || '–' },
    { key: 'to_account', label: 'На счет', render: (row) => row.to_account?.name || '–' },
    { 
      key: 'transaction_type', 
      label: 'Тип', 
      render: (row) => {
        // 2. Adapt type label color
        let typeClass = '';
        switch (row.transaction_type) {
          case 'INCOME':
            typeClass = 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-200';
            return <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${typeClass}`}>Доход</span>;
          case 'EXPENSE':
            typeClass = 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-200';
            return <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${typeClass}`}>Расход</span>;
          case 'TRANSFER':
            typeClass = 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-200';
            return <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${typeClass}`}>Перевод</span>;
          default:
            return row.transaction_type;
        }
      }
    },
  ], [activeWorkspace?.currency]);

  return (
    // The modal container already has its theme, so we only adapt the content
    <div className="p-1 sm:p-4">
      {loading && <Loader text="Загрузка транзакций..." />}
      {error && <Alert type="error">{error}</Alert>}

      {!loading && !error && (
        <>
          {transactions.length > 0 ? (
            <>
              <UniversalTable
                columns={columns}
                data={transactions}
                emptyMessage="Нет транзакций для этой статьи."
              />
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={setCurrentPage}
                totalItems={totalItems}
                itemsPerPage={itemsPerPage}
              />
            </>
          ) : (
            // 3. Adapt empty state message
            <p className="text-center text-gray-500 dark:text-gray-400 py-8">Нет транзакций для этой статьи за выбранный период.</p>
          )}
        </>
      )}
    </div>
  );
};

export default TransactionsListForDdsArticle;