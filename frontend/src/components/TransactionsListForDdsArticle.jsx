// frontend/src/components/TransactionsListForDdsArticle.jsx
import React, { useEffect, useState } from 'react';
import { apiService } from '../services/apiService';
import { useAuth } from '../contexts/AuthContext';
import { format, parseISO } from 'date-fns';

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
          skip: (currentPage - 1) * itemsPerPage,
          limit: itemsPerPage,
        };

        console.log("DEBUG(TransactionsListForDdsArticle): Fetching transactions with params:", params); // ИСПРАВЛЕНО: Логирование параметров запроса
        const response = await apiService.getTransactions(params);
        console.log("DEBUG(TransactionsListForDdsArticle): API response received:", response); // ИСПРАВЛЕНО: Логирование полного ответа API
        
        setTransactions(Array.isArray(response.items) ? response.items : []);
        setTotalPages(Math.ceil(response.total_count / itemsPerPage));
      } catch (err) {
        console.error("Error fetching transactions for DDS article:", err);
        setError(err.message || "Ошибка при загрузке транзакций.");
      } finally {
        setLoading(false);
      }
    };

    fetchTransactions();
  }, [activeWorkspace, articleId, currentPage]);

  const columns = [
    { key: 'transaction_date', label: 'Дата', render: (row) => format(parseISO(row.transaction_date), 'dd.MM.yyyy') },
    { key: 'description', label: 'Описание' },
    { key: 'amount', label: 'Сумма', render: (row) => `${row.amount} ${activeWorkspace?.currency || 'RUB'}` },
    { key: 'from_account', label: 'Со счета', render: (row) => row.from_account?.name || '-' },
    { key: 'to_account', label: 'На счет', render: (row) => row.to_account?.name || '-' },
    { key: 'transaction_type', label: 'Тип', render: (row) => {
        switch (row.transaction_type) {
            case 'INCOME': return 'Доход';
            case 'EXPENSE': return 'Расход';
            case 'TRANSFER': return 'Перевод';
            default: return row.transaction_type;
        }
    }},
  ];

  return (
    <div className="p-4">
      {loading && <Loader text="Загрузка транзакций..." />}
      {error && <Alert type="error">{error}</Alert>}

      {!loading && !error && (
        <>
          {transactions && transactions.length > 0 ? (
            <>
              <UniversalTable
                headers={columns}
                data={transactions}
                loading={loading}
                emptyMessage="Нет транзакций для этой статьи."
              />
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={setCurrentPage}
              />
            </>
          ) : (
            <p className="text-center text-gray-500">Нет транзакций для этой статьи.</p>
          )}
        </>
      )}
    </div>
  );
};

export default TransactionsListForDdsArticle;