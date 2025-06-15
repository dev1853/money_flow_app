// frontend/src/components/StatementUploadModal.jsx
import { useState, useEffect, useCallback, Fragment } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { ArrowUpTrayIcon, CheckCircleIcon } from '@heroicons/react/24/solid';
import { format, parseISO } from 'date-fns';

import Button from './Button';
import Alert from './Alert';
import Modal from './Modal';
import Loader from './Loader';
import Label from './forms/Label';
import Select from './forms/Select';
import Input from './forms/Input'; // Возможно понадобится, если file input будет заменен на Input

import { apiService } from '../services/apiService';

function StatementUploadModal({ isOpen, onClose, onUploadSuccess, formId }) {
  const { isAuthenticated, activeWorkspace } = useAuth();

  const [selectedAccountId, setSelectedAccountId] = useState('');
  const [defaultIncomeArticleId, setDefaultIncomeArticleId] = useState('');
  const [defaultExpenseArticleId, setDefaultExpenseArticleId] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);

  const [availableAccounts, setAvailableAccounts] = useState([]);
  const [allFlatArticles, setAllFlatArticles] = useState([]);

  const [isLoading, setIsLoading] = useState(false);
  const [isDropdownLoading, setIsDropdownLoading] = useState(false);

  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);

  const [step, setStep] = useState(1);
  const [transactionsToReview, setTransactionsToReview] = useState([]);

  // commonLabelClasses и commonInputClasses можно удалить, так как они теперь в Label/Input/Select
  // const commonLabelClasses = "block text-sm font-medium text-gray-700 mb-1 text-left";
  // const commonInputClasses = "mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm h-10";

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
    if (!isAuthenticated || !activeWorkspace) {
        setError("Рабочее пространство не выбрано или необходима аутентификация для загрузки справочников.");
        setIsDropdownLoading(false);
        return;
    }
    setIsDropdownLoading(true);
    setError(null);
    try {
      const accountsData = await apiService.get(`/accounts/?workspace_id=${activeWorkspace.id}&limit=500&is_active=true`);
      setAvailableAccounts(accountsData);

      const articlesDataRaw = await apiService.get(`/dds_articles?workspace_id=${activeWorkspace.id}`);
      const articlesData = Array.isArray(articlesDataRaw) ? articlesDataRaw : [];
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
      setAllFlatArticles(flatArticles);

    } catch (err) {
      console.error("StatementUploadModal: Ошибка загрузки справочников:", err);
      setError(`Не удалось загрузить справочники: ${err.message}`);
    } finally {
      setIsDropdownLoading(false);
    }
  }, [isAuthenticated, activeWorkspace]);

  useEffect(() => {
    if (isOpen) {
      resetFormState();
      fetchDropdownData();
    }
  }, [isOpen, fetchDropdownData, resetFormState]);

  const availableIncomeArticles = allFlatArticles.filter(a => a.type === 'income');
  const availableExpenseArticles = allFlatArticles.filter(a => a.type === 'expense');

  const handleFileChange = (event) => { setSelectedFile(event.target.files[0]); };

  const handleInitialUploadSubmit = async (event) => {
    event.preventDefault();
    if (!selectedFile || !selectedAccountId || !defaultIncomeArticleId || !defaultExpenseArticleId ) {
        setError("Пожалуйста, заполните все поля и выберите файл.");
        return;
    }
    if (!isAuthenticated || !activeWorkspace) { setError("Ошибка аутентификации или рабочее пространство не выбрано."); return; }

    setIsLoading(true); setError(null); setSuccessMessage(null); setTransactionsToReview([]);

    const formData = new FormData();
    formData.append('file', selectedFile);
    formData.append('account_id', selectedAccountId);
    formData.append('default_income_article_id', defaultIncomeArticleId);
    formData.append('default_expense_article_id', defaultExpenseArticleId);
    formData.append('workspace_id', activeWorkspace.id);

    try {
      const result = await apiService.post('/statements/upload/tinkoff-csv/', formData, {
        headers: { 'Content-Type': undefined }
      });

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
    } catch (err) {
        console.error("StatementUploadModal: Ошибка загрузки выписки:", err);
        setError(err.message || 'Произошла ошибка при загрузке выписки.');
    } finally {
        setIsLoading(false);
    }
  };

  const handleReviewArticleChange = (index, newArticleId) => {
    const updatedTransactions = [...transactionsToReview];
    updatedTransactions[index].selected_dds_article_id = parseInt(newArticleId, 10);
    setTransactionsToReview(updatedTransactions);
  };

  const handleSaveReviewedTransactions = async () => {
    setIsLoading(true); setError(null); setSuccessMessage(null);
    if (!isAuthenticated || !activeWorkspace) { setError("Ошибка аутентификации или рабочее пространство не выбрано."); setIsLoading(false); return; }

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
      workspace_id: activeWorkspace.id,
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
      const result = await apiService.post('/transactions/batch-categorize/', payload);
      setSuccessMessage(`Классификация сохранена! Успешно создано: ${result.successfully_created}. Ошибки: ${result.failed_to_create}.`);
      if (onUploadSuccess) onUploadSuccess();
      setStep(1);
      setTransactionsToReview([]);
    } catch (err) {
      console.error("StatementUploadModal: Ошибка сохранения классифицированных транзакций:", err);
      setError(err.message || 'Произошла ошибка при сохранении классифицированных транзакций.');
    } finally {
      setIsLoading(false);
    }
  };

  const footerStep1 = (
    <div className="flex justify-end space-x-3">
      <Button variant="secondary" size="md" onClick={onClose} disabled={isLoading}>
        Отмена
      </Button>
      <Button
        type="submit"
        variant="primary"
        size="md"
        form={`${formId}-step1`}
        disabled={isLoading || !selectedFile}
        iconLeft={!isLoading ? <ArrowUpTrayIcon className="h-5 w-5" /> : null}
      >
        {isLoading ? 'Обработка...' : 'Загрузить и обработать'}
      </Button>
    </div>
  );

  const footerStep2 = (
    <div className="flex justify-end space-x-3">
      <Button variant="secondary" size="md" onClick={onClose} disabled={isLoading }>
        Отмена
      </Button>
      <Button
        type="submit"
        variant="success"
        size="md"
        form={`${formId}-step2`}
        onClick={handleSaveReviewedTransactions}
        disabled={isLoading || transactionsToReview.every(t => !t.selected_dds_article_id || t.selected_dds_article_id === 0)}
        iconLeft={!isLoading ? <CheckCircleIcon className="h-5 w-5" /> : null}
      >
        {isLoading ? 'Сохранение...' : 'Сохранить классифицированные'}
      </Button>
    </div>
  );

  if (!isOpen) return null;

  const modalTitle = step === 1 ? "Загрузка выписки (Т-Банк CSV)" : "Уточнение категорий транзакций";
  const customMaxWidth = "max-w-3xl";

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={modalTitle} maxWidth={customMaxWidth} footer={step === 1 ? footerStep1 : footerStep2}>
      {error && !isDropdownLoading && <Alert type="error" title="Ошибка" message={error} className="mb-4" />}

      {isDropdownLoading && (
          <div className="py-8">
              <Loader message="Загрузка данных для формы..." />
          </div>
      )}

      {!isDropdownLoading && !error && (
        <>
          {step === 1 && (
            <form id={`${formId}-step1`} onSubmit={handleInitialUploadSubmit} className="mt-2 space-y-5">
              <div>
                <Label htmlFor={`${formId}-upload-account-id`}>Счет зачисления/списания</Label>
                <Select id={`${formId}-upload-account-id`} value={selectedAccountId} onChange={(e) => setSelectedAccountId(e.target.value)} required disabled={isLoading || isDropdownLoading}> {/* Убраны дублирующиеся классы */}
                  <option value="" disabled>-- Выберите счет --</option>
                  {availableAccounts.map(acc => <option key={acc.id} value={acc.id}>{acc.name} ({acc.currency})</option>)}
                </Select>
              </div>
              <div>
                <Label htmlFor={`${formId}-upload-default-income`}>Статья ДДС для доходов по умолчанию</Label>
                <Select id={`${formId}-upload-default-income`} value={defaultIncomeArticleId} onChange={(e) => setDefaultIncomeArticleId(e.target.value)} required disabled={isLoading || isDropdownLoading}> {/* Убраны дублирующиеся классы */}
                  <option value="" disabled>-- Выберите статью дохода --</option>
                  {availableIncomeArticles.map(art => <option key={art.id} value={art.id}>{art.displayName}</option>)}
                </Select>
              </div>
              <div>
                <Label htmlFor={`${formId}-upload-default-expense`}>Статья ДДС для расходов по умолчанию</Label>
                <Select id={`${formId}-upload-default-expense`} value={defaultExpenseArticleId} onChange={(e) => setDefaultExpenseArticleId(e.target.value)} required disabled={isLoading || isDropdownLoading}> {/* Убраны дублирующиеся классы */}
                  <option value="" disabled>-- Выберите статью расхода --</option>
                  {availableExpenseArticles.map(art => <option key={art.id} value={art.id}>{art.displayName}</option>)}
                </Select>
              </div>
              <div>
                  <Label htmlFor={`${formId}-csv-file`}>CSV файл выписки</Label>
                  <input type="file" id={`${formId}-csv-file`} accept=".csv" onChange={handleFileChange} required
                    className="mt-1 block w-full text-sm text-gray-700 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100 cursor-pointer"
                    disabled={isLoading || isDropdownLoading}
                  />
              </div>

              {successMessage && !transactionsToReview.length && <Alert type="success" message={successMessage} className="my-2" />}
            </form>
          )}

          {step === 2 && transactionsToReview.length > 0 && (
            <form id={`${formId}-step2`} onSubmit={(e) => { e.preventDefault(); handleSaveReviewedTransactions(); }} className="mt-2">
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
                          <Select
                            value={t.selected_dds_article_id || ''}
                            onChange={(e) => handleReviewArticleChange(index, e.target.value)}
                            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50 text-xs sm:text-sm h-9 py-1" // Здесь оставляем все классы, т.к. этот Select специфичен для таблицы
                          >
                            <option value="" disabled>-- Выберите статью --</option>
                            {(t.is_income ? availableIncomeArticles : availableExpenseArticles).map(art => (
                              <option key={art.id} value={art.id}>{art.displayName}</option>
                            ))}
                          </Select>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {error && step === 2 && <Alert type="error" message={error} className="mt-3" />}
            </form>
          )}
        </>
      )}
    </Modal>
  );
}

export default StatementUploadModal;