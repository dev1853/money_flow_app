// frontend/src/components/StatementUploadModal.jsx
import { useState, useEffect, useCallback, Fragment } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { ArrowUpTrayIcon, XMarkIcon, CheckCircleIcon } from '@heroicons/react/24/solid';
import { format, parseISO } from 'date-fns';

import Button from './Button';
import Alert from './Alert';
import Modal from './Modal';
import { API_BASE_URL } from '../apiConfig';
import Loader from './Loader'; // Добавим импорт Loader на случай, если он нужен

function StatementUploadModal({ isOpen, onClose, onUploadSuccess }) {
  const { token, isAuthenticated } = useAuth();

  const [selectedAccountId, setSelectedAccountId] = useState('');
  const [defaultIncomeArticleId, setDefaultIncomeArticleId] = useState('');
  const [defaultExpenseArticleId, setDefaultExpenseArticleId] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);

  const [availableAccounts, setAvailableAccounts] = useState([]);
  const [allFlatArticles, setAllFlatArticles] = useState([]);

  const [isLoading, setIsLoading] = useState(false); // Общий isLoading для операций внутри модалки
  const [isDropdownLoading, setIsDropdownLoading] = useState(false); // Отдельный для загрузки данных дропдаунов

  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);

  const [step, setStep] = useState(1);
  const [transactionsToReview, setTransactionsToReview] = useState([]);

  const commonLabelClasses = "block text-sm font-medium text-gray-700 mb-1 text-left";
  const commonInputClasses = "mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm h-10";

  const resetFormState = useCallback(() => {
    setSelectedAccountId('');
    setDefaultIncomeArticleId('');
    setDefaultExpenseArticleId('');
    setSelectedFile(null);
    setError(null);
    setSuccessMessage(null);
    setTransactionsToReview([]);
    setStep(1);
  }, []);

  const fetchDropdownData = useCallback(async () => {
    // console.log("STM: fetchDropdownData called. IsOpen:", isOpen, "Token:", !!token, "IsAuthenticated:", isAuthenticated); // STM: LOG 1
    if (!isAuthenticated || !token) {
        setError("Необходима аутентификация для загрузки справочников.");
        // console.error("STM: Auth check failed in fetchDropdownData"); // STM: LOG 2
        setIsDropdownLoading(false); // Используем отдельный лоадер
        return;
    }
    setIsDropdownLoading(true); // Используем отдельный лоадер
    setError(null);
    const headers = { 'Authorization': `Bearer ${token}` };
    try {
      // console.log("STM: Fetching accounts..."); // STM: LOG 3
      const accResponse = await fetch(`${API_BASE_URL}/accounts/?limit=500&is_active=true`, { headers });
      // console.log("STM: Accounts response status:", accResponse.status); // STM: LOG 4
      if (accResponse.ok) {
        const accData = await accResponse.json();
        // console.log("STM: Accounts data:", accData); // STM: LOG 5
        setAvailableAccounts(accData);
      } else {
        const errorText = await accResponse.text();
        // console.error("STM: Ошибка загрузки счетов, статус:", accResponse.status, "текст:", errorText); // STM: LOG 6
        throw new Error(`Ошибка загрузки счетов: ${accResponse.status}`);
      }

      // console.log("STM: Fetching articles..."); // STM: LOG 7
      const artResponse = await fetch(`${API_BASE_URL}/articles/`, { headers });
      // console.log("STM: Articles response status:", artResponse.status); // STM: LOG 8
      if (artResponse.ok) {
        const articlesData = await artResponse.json();
        // console.log("STM: Articles data raw:", articlesData); // STM: LOG 9
        const flattenArticles = (articles, level = 0) => {
          let flatList = [];
          articles.forEach(article => {
            if (!article.is_archived && !(article.children && article.children.length > 0)) {
              flatList.push({ ...article, displayName: `${'—'.repeat(level)} ${article.name}` });
            }
            if (article.children && article.children.length > 0) {
              flatList = flatList.concat(flattenArticles(article.children, level + 1));
            }
          });
          return flatList;
        };
        const flatArticles = flattenArticles(articlesData);
        // console.log("STM: Flattened articles:", flatArticles); // STM: LOG 10
        setAllFlatArticles(flatArticles);
      } else {
        const errorText = await artResponse.text();
        // console.error("STM: Ошибка загрузки статей ДДС, статус:", artResponse.status, "текст:", errorText); // STM: LOG 11
        throw new Error(`Ошибка загрузки статей ДДС: ${artResponse.status}`);
      }
    } catch (err) {
      // console.error("STM: Error in fetchDropdownData catch block:", err); // STM: LOG 12
      setError(`Не удалось загрузить справочники: ${err.message}`);
    } finally {
      // console.log("STM: fetchDropdownData finally block. Setting isDropdownLoading to false."); // STM: LOG 13
      setIsDropdownLoading(false);
    }
  }, [token, isAuthenticated]);


  useEffect(() => {
    if (isOpen) {
      resetFormState();
      fetchDropdownData();
    }
  }, [isOpen, fetchDropdownData, resetFormState]);

  const availableIncomeArticles = allFlatArticles.filter(a => a.article_type === 'income');
  const availableExpenseArticles = allFlatArticles.filter(a => a.article_type === 'expense');

  const handleFileChange = (event) => { setSelectedFile(event.target.files[0]); };

  const handleInitialUploadSubmit = async (event) => {
    event.preventDefault();
    if (!selectedFile || !selectedAccountId || !defaultIncomeArticleId || !defaultExpenseArticleId ) {
        setError("Пожалуйста, заполните все поля и выберите файл.");
        return;
    }
    if (!token) { setError("Ошибка аутентификации."); return; }

    setIsLoading(true); setError(null); setSuccessMessage(null); setTransactionsToReview([]);

    const formData = new FormData();
    formData.append('file', selectedFile);
    formData.append('account_id', selectedAccountId);
    formData.append('default_income_article_id', defaultIncomeArticleId);
    formData.append('default_expense_article_id', defaultExpenseArticleId);

    try {
      const response = await fetch(`${API_BASE_URL}/statements/upload/tinkoff-csv/`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData,
      });
      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.detail || `Ошибка загрузки: ${response.status} ${response.statusText}`);
      }

      let baseMessage = `Выписка передана на обработку. Автоматически создано: ${result.created_transactions_auto}. Пропущено дубликатов: ${result.skipped_duplicates_count}. Ошибочных строк: ${result.failed_rows}.`;
      if (result.transactions_for_review && result.transactions_for_review.length > 0) {
        setTransactionsToReview(
          result.transactions_for_review.map(t => ({
            ...t,
            selected_dds_article_id: t.suggested_dds_article_id?.toString() || ''
          }))
        );
        setSuccessMessage(`${baseMessage} Обнаружены транзакции для уточнения категории.`);
        setStep(2);
      } else {
        setSuccessMessage(`${baseMessage} Все транзакции классифицированы или пропущены.`);
        if (onUploadSuccess) onUploadSuccess();
      }
    } catch (err) { setError(err.message); }
    finally { setIsLoading(false); }
  };

  const handleReviewArticleChange = (index, newArticleId) => {
    const updatedTransactions = [...transactionsToReview];
    updatedTransactions[index].selected_dds_article_id = parseInt(newArticleId, 10);
    setTransactionsToReview(updatedTransactions);
  };

  const handleSaveReviewedTransactions = async () => {
    setIsLoading(true); setError(null); setSuccessMessage(null);
    if (!token) { setError("Ошибка аутентификации."); setIsLoading(false); return; }

    const transactionsToSave = transactionsToReview.filter(t => t.selected_dds_article_id && t.selected_dds_article_id !== 0);
    if (transactionsToSave.length === 0 && transactionsToReview.length > 0) {
        setSuccessMessage("Нет выбранных транзакций для сохранения после ревью.");
        setIsLoading(false);
        if (onUploadSuccess) onUploadSuccess();
        return;
    }
     if (transactionsToSave.length === 0 && transactionsToReview.length === 0) {
        setIsLoading(false);
        return;
    }

    const payload = {
      transactions: transactionsToSave.map(t => ({
        transaction_date: t.transaction_date,
        amount: t.amount,
        description: t.description,
        contractor: t.contractor,
        account_id: parseInt(selectedAccountId),
        dds_article_id: t.selected_dds_article_id,
      }))
    };

    try {
      const response = await fetch(`${API_BASE_URL}/transactions/batch-categorize/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(payload),
      });
      const result = await response.json();
      if (!response.ok) { throw new Error(result.detail || 'Ошибка сохранения классифицированных транзакций.'); }

      setSuccessMessage(`Классификация сохранена! Успешно создано: ${result.successfully_created}. Ошибки: ${result.failed_to_create}.`);
      if (onUploadSuccess) onUploadSuccess();
      setStep(1);
      setTransactionsToReview([]);
    } catch (err) { setError(err.message); }
    finally { setIsLoading(false); }
  };

  const handleCloseModal = () => {
    if (!isLoading && !isDropdownLoading) { // Проверяем оба лоадера
      onClose();
    }
  };

  if (!isOpen) return null;

  const modalTitle = step === 1 ? "Загрузка выписки (Т-Банк CSV)" : "Уточнение категорий транзакций";
  const customMaxWidth = "max-w-3xl";

  return (
    <Modal isOpen={isOpen} onClose={handleCloseModal} title={modalTitle} maxWidth={customMaxWidth}>
      {/* Отображение общей ошибки загрузки справочников */}
      {error && !isDropdownLoading && <Alert type="error" title="Ошибка" message={error} className="mb-4" />}

      {/* Лоадер для fetchDropdownData */}
      {isDropdownLoading && (
          <div className="py-8">
              <Loader message="Загрузка данных для формы..." />
          </div>
      )}

      {/* Показываем формы только если нет основной загрузки и нет критической ошибки загрузки данных */}
      {!isDropdownLoading && !error && (
        <>
          {step === 1 && (
            <form onSubmit={handleInitialUploadSubmit} className="mt-2 space-y-5">
              <div>
                <label htmlFor="upload-account-id" className={commonLabelClasses}>Счет зачисления/списания</label>
                <select id="upload-account-id" value={selectedAccountId} onChange={(e) => setSelectedAccountId(e.target.value)} required className={commonInputClasses} disabled={isLoading || isDropdownLoading}>
                  <option value="" disabled>-- Выберите счет --</option>
                  {availableAccounts.map(acc => <option key={acc.id} value={acc.id}>{acc.name} ({acc.currency})</option>)}
                </select>
              </div>
              <div>
                <label htmlFor="upload-default-income" className={commonLabelClasses}>Статья ДДС для доходов по умолчанию</label>
                <select id="upload-default-income" value={defaultIncomeArticleId} onChange={(e) => setDefaultIncomeArticleId(e.target.value)} required className={commonInputClasses} disabled={isLoading || isDropdownLoading}>
                  <option value="" disabled>-- Выберите статью дохода --</option>
                  {availableIncomeArticles.map(art => <option key={art.id} value={art.id}>{art.displayName}</option>)}
                </select>
              </div>
              <div>
                <label htmlFor="upload-default-expense" className={commonLabelClasses}>Статья ДДС для расходов по умолчанию</label>
                <select id="upload-default-expense" value={defaultExpenseArticleId} onChange={(e) => setDefaultExpenseArticleId(e.target.value)} required className={commonInputClasses} disabled={isLoading || isDropdownLoading}>
                  <option value="" disabled>-- Выберите статью расхода --</option>
                  {availableExpenseArticles.map(art => <option key={art.id} value={art.id}>{art.displayName}</option>)}
                </select>
              </div>
              <div>
                  <label htmlFor="csv-file" className={commonLabelClasses}>CSV файл выписки</label>
                  <input type="file" id="csv-file" accept=".csv" onChange={handleFileChange} required
                    className="mt-1 block w-full text-sm text-gray-700 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100 cursor-pointer"
                    disabled={isLoading || isDropdownLoading}
                  />
              </div>

              {/* Сообщение об успехе/ошибке конкретно операции загрузки файла */}
              {/* error здесь может быть перезаписан ошибкой от fetchDropdownData, если Alert для него не показывается */}
              {/* Для большей ясности можно использовать отдельный стейт для ошибки операции */}
              {/* {submitError && <Alert type="error" message={submitError} className="my-2" />} */}
              {successMessage && !transactionsToReview.length && <Alert type="success" message={successMessage} className="my-2" />}

              <div className="mt-6 pt-4 border-t border-gray-200 flex justify-end space-x-3">
                <Button variant="secondary" size="md" onClick={handleCloseModal} disabled={isLoading || isDropdownLoading}>
                  Отмена
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  size="md"
                  disabled={isLoading || isDropdownLoading || !selectedFile}
                  iconLeft={!isLoading ? <ArrowUpTrayIcon className="h-5 w-5" /> : null}
                >
                  {isLoading ? 'Обработка...' : 'Загрузить и обработать'}
                </Button>
              </div>
            </form>
          )}

          {step === 2 && transactionsToReview.length > 0 && (
            <div className="mt-2">
              {successMessage && !error && <Alert type="info" message={successMessage} className="mb-4" />}
              <p className="text-sm text-gray-700 mb-3">Пожалуйста, проверьте и при необходимости скорректируйте статьи ДДС для следующих операций:</p>
              <div className="max-h-[50vh] overflow-y-auto border border-gray-300 rounded-md">
                <table className="min-w-full divide-y divide-gray-200 text-xs sm:text-sm">
                  <thead className="bg-gray-100 sticky top-0 z-10">
                    <tr>
                      <th className="px-3 py-2.5 text-left font-semibold text-gray-600">Дата</th>
                      <th className="px-3 py-2.5 text-left font-semibold text-gray-600">Описание</th>
                      <th className="px-3 py-2.5 text-left font-semibold text-gray-600">Контрагент</th>
                      <th className="px-3 py-2.5 text-right font-semibold text-gray-600">Сумма</th>
                      <th className="px-3 py-2.5 text-left font-semibold text-gray-600 min-w-[200px]">Статья ДДС</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {transactionsToReview.map((t, index) => (
                      <tr key={t.original_row_index || index} className="hover:bg-gray-50">
                        <td className="px-3 py-2 whitespace-nowrap text-gray-700">{format(parseISO(t.transaction_date), 'dd.MM.yyyy')}</td>
                        <td className="px-3 py-2 text-gray-700"><div className="w-32 sm:w-40 md:w-56 truncate" title={t.description}>{t.description}</div></td>
                        <td className="px-3 py-2 text-gray-700"><div className="w-24 sm:w-32 md:w-40 truncate" title={t.contractor}>{t.contractor || '-'}</div></td>
                        <td className={`px-3 py-2 text-right whitespace-nowrap font-medium ${t.is_income ? 'text-green-600' : 'text-red-600'}`}>
                          {t.is_income ? '+' : '-'}{parseFloat(t.amount).toLocaleString('ru-RU')}
                        </td>
                        <td className="px-3 py-2">
                          <select
                            value={t.selected_dds_article_id || ''}
                            onChange={(e) => handleReviewArticleChange(index, e.target.value)}
                            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50 text-xs sm:text-sm h-9 py-1"
                          >
                            <option value="" disabled>-- Выберите статью --</option>
                            {(t.is_income ? availableIncomeArticles : availableExpenseArticles).map(art => (
                              <option key={art.id} value={art.id}>{art.displayName}</option>
                            ))}
                          </select>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {/* Ошибка операции сохранения ревью */}
              {error && step === 2 && <Alert type="error" message={error} className="mt-3" />}
              <div className="mt-6 pt-4 border-t border-gray-200 flex justify-end space-x-3">
                <Button variant="secondary" size="md" onClick={handleCloseModal} disabled={isLoading || isDropdownLoading }>
                  Отмена
                </Button>
                <Button
                  variant="success"
                  size="md"
                  onClick={handleSaveReviewedTransactions}
                  disabled={isLoading || isDropdownLoading || transactionsToReview.every(t => !t.selected_dds_article_id || t.selected_dds_article_id === 0)}
                  iconLeft={!isLoading ? <CheckCircleIcon className="h-5 w-5" /> : null}
                >
                  {isLoading ? 'Сохранение...' : 'Сохранить классифицированные'}
                </Button>
              </div>
            </div>
          )}
        </>
      )}
    </Modal>
  );
}

export default StatementUploadModal;