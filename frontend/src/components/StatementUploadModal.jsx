// src/components/StatementUploadModal.jsx
import { useState, useEffect, useCallback, Fragment } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Dialog, Transition } from '@headlessui/react';
import { ArrowUpTrayIcon, XMarkIcon, CheckCircleIcon, ExclamationTriangleIcon } from '@heroicons/react/24/solid';
import { format, parseISO } from 'date-fns';

function StatementUploadModal({ isOpen, onClose, onUploadSuccess }) {
  const { token, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const [selectedAccountId, setSelectedAccountId] = useState('');
  const [defaultIncomeArticleId, setDefaultIncomeArticleId] = useState('');
  const [defaultExpenseArticleId, setDefaultExpenseArticleId] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  
  const [availableAccounts, setAvailableAccounts] = useState([]);
  const [allFlatArticles, setAllFlatArticles] = useState([]); 
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);

  const [step, setStep] = useState(1); 
  const [transactionsToReview, setTransactionsToReview] = useState([]);

  const commonLabelClasses = "block text-sm font-medium text-gray-700 mb-1 text-left";
  const commonInputClasses = "mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm h-10";
  
  const baseButtonClasses = "inline-flex items-center justify-center px-4 py-2 border text-sm font-medium rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 h-10 disabled:opacity-50";
  const primaryButtonClasses = `${baseButtonClasses} text-white bg-indigo-600 hover:bg-indigo-700 focus:ring-indigo-500`;
  const secondaryButtonClasses = `${baseButtonClasses} text-gray-700 bg-white hover:bg-gray-50 border-gray-300 focus:ring-indigo-500`;
  const greenButtonClasses = `${baseButtonClasses} text-white bg-green-600 hover:bg-green-700 focus:ring-green-500`;

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
    if (!isAuthenticated || !token) {
        setError("Необходима аутентификация для загрузки справочников.");
        return;
    }
    setIsLoading(true); // Показываем загрузку на время получения данных для формы
    const headers = { 'Authorization': `Bearer ${token}` };
    try {
      const accResponse = await fetch('http://localhost:8000/accounts/?limit=500&is_active=true', { headers });
      if (accResponse.ok) {
        setAvailableAccounts(await accResponse.json());
      } else {
        console.error("StatementUploadModal: Ошибка загрузки счетов", await accResponse.text());
        throw new Error("Ошибка загрузки счетов");
      }

      const artResponse = await fetch('http://localhost:8000/articles/', { headers });
      if (artResponse.ok) {
        const articlesData = await artResponse.json();
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
        setAllFlatArticles(flattenArticles(articlesData));
      } else {
        console.error("StatementUploadModal: Ошибка загрузки статей ДДС", await artResponse.text());
        throw new Error("Ошибка загрузки статей ДДС");
      }
    } catch (err) { 
      console.error("StatementUploadModal: Ошибка загрузки данных для формы:", err);
      setError(`Не удалось загрузить справочники: ${err.message}`); 
    } finally {
      setIsLoading(false);
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
      const response = await fetch('http://localhost:8000/statements/upload/tinkoff-csv/', {
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
    if (transactionsToSave.length === 0 && transactionsToReview.length > 0) { // Если были транзакции на ревью, но ни одна не выбрана для сохранения
        setSuccessMessage("Нет выбранных транзакций для сохранения после ревью.");
        setIsLoading(false);
        // setStep(1); // Можно вернуть на первый шаг или оставить на втором
        if (onUploadSuccess) onUploadSuccess(); // Обновить список, если были авто-созданные
        return;
    }
     if (transactionsToSave.length === 0 && transactionsToReview.length === 0) { // Если изначально не было транзакций на ревью
        // Это состояние не должно возникать, если кнопка сохранения неактивна или не видна
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
        // employee: null, // Если бэкенд требует, но не используется при импорте
      }))
    };

    try {
      const response = await fetch('http://localhost:8000/transactions/batch-categorize/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(payload),
      });
      const result = await response.json();
      if (!response.ok) { throw new Error(result.detail || 'Ошибка сохранения классифицированных транзакций.'); }
      
      setSuccessMessage(`Классификация сохранена! Успешно создано: ${result.successfully_created}. Ошибки: ${result.failed_to_create}.`);
      if (onUploadSuccess) onUploadSuccess();
      setStep(1); 
      setTransactionsToReview([]); // Очищаем список после сохранения
      // setTimeout(onClose, 3000); // Можно закрывать автоматически
    } catch (err) { setError(err.message); } 
    finally { setIsLoading(false); }
  };

  // Чтобы закрывать модальное окно только если не идет загрузка
  const handleCloseModal = () => {
    if (!isLoading) {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <Transition appear show={isOpen} as={Fragment}> {/* <Transition as={Fragment}> - это нормально для корневого Transition */}
      <Dialog as="div" className="relative z-50" onClose={() => { if(!isLoading) onClose(); }}>
        <Transition.Child
          as="div" // Указываем, что он должен рендериться как div
          className="fixed inset-0 bg-black/30" // Переносим стили сюда
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/30" /> {/* Единственный дочерний элемент - div */}
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 text-center">
            <Transition.Child
              as="div" // Указываем, что он должен рендериться как div
              className="w-full max-w-2xl transform overflow-hidden rounded-xl bg-white p-6 text-left align-middle shadow-xl transition-all"
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-xl md:max-w-2xl lg:max-w-3xl transform overflow-hidden rounded-xl bg-white p-6 text-left align-middle shadow-xl transition-all">
                <div className="flex justify-between items-start">
                  <Dialog.Title as="h3" className="text-lg font-semibold leading-6 text-gray-900">
                    {step === 1 ? "Загрузка выписки (Т-Банк CSV)" : "Уточнение категорий транзакций"}
                  </Dialog.Title>
                  <button 
                    type="button" 
                    onClick={handleCloseModal} // Используем handleCloseModal
                    className="p-1 rounded-md text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    disabled={isLoading}
                  >
                    <XMarkIcon className="h-6 w-6" />
                  </button>
                </div>
                
                {/* Шаг 1: Форма загрузки файла */}
                {step === 1 && (
                  <form onSubmit={handleInitialUploadSubmit} className="mt-5 space-y-5">
                    <div>
                      <label htmlFor="upload-account-id" className={commonLabelClasses}>Счет зачисления/списания</label>
                      <select id="upload-account-id" value={selectedAccountId} onChange={(e) => setSelectedAccountId(e.target.value)} required className={commonInputClasses} disabled={isLoading}>
                        <option value="" disabled>-- Выберите счет --</option>
                        {availableAccounts.map(acc => <option key={acc.id} value={acc.id}>{acc.name} ({acc.currency})</option>)}
                      </select>
                    </div>
                    <div>
                      <label htmlFor="upload-default-income" className={commonLabelClasses}>Статья ДДС для доходов по умолчанию</label>
                      <select id="upload-default-income" value={defaultIncomeArticleId} onChange={(e) => setDefaultIncomeArticleId(e.target.value)} required className={commonInputClasses} disabled={isLoading}>
                        <option value="" disabled>-- Выберите статью дохода --</option>
                        {availableIncomeArticles.map(art => <option key={art.id} value={art.id}>{art.displayName}</option>)}
                      </select>
                    </div>
                    <div>
                      <label htmlFor="upload-default-expense" className={commonLabelClasses}>Статья ДДС для расходов по умолчанию</label>
                      <select id="upload-default-expense" value={defaultExpenseArticleId} onChange={(e) => setDefaultExpenseArticleId(e.target.value)} required className={commonInputClasses} disabled={isLoading}>
                        <option value="" disabled>-- Выберите статью расхода --</option>
                        {availableExpenseArticles.map(art => <option key={art.id} value={art.id}>{art.displayName}</option>)}
                      </select>
                    </div>
                    <div>
                        <label htmlFor="csv-file" className={commonLabelClasses}>CSV файл выписки</label>
                        <input type="file" id="csv-file" accept=".csv" onChange={handleFileChange} required
                          className="mt-1 block w-full text-sm text-gray-700 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100 cursor-pointer"
                          disabled={isLoading}
                        />
                    </div>

                    {error && <p className="text-sm text-red-700 bg-red-100 p-3 rounded-md border border-red-200">{error}</p>}
                    {successMessage && !transactionsToReview.length && <p className="text-sm text-green-700 bg-green-100 p-3 rounded-md border border-green-200">{successMessage}</p>}

                    <div className="mt-6 pt-4 border-t border-gray-200 flex justify-end space-x-3">
                      <button type="button" onClick={handleCloseModal} className={secondaryButtonClasses} disabled={isLoading}>
                        Отмена
                      </button>
                      <button type="submit" disabled={isLoading || !selectedFile} className={primaryButtonClasses}>
                        <ArrowUpTrayIcon className="-ml-1 h-5 w-5 mr-2" />
                        {isLoading ? 'Обработка...' : 'Загрузить и обработать'}
                      </button>
                    </div>
                  </form>
                )}

                {/* Шаг 2: Ревью транзакций */}
                {step === 2 && transactionsToReview.length > 0 && (
                  <div className="mt-5">
                    {successMessage && !error && <p className="mb-4 text-sm text-blue-700 bg-blue-100 p-3 rounded-md border border-blue-200">{successMessage}</p>}
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
                    {error && <p className="mt-3 text-sm text-red-600 bg-red-100 p-3 rounded-md border border-red-200">{error}</p>}
                    <div className="mt-6 pt-4 border-t border-gray-200 flex justify-end space-x-3">
                      <button type="button" onClick={handleCloseModal} className={secondaryButtonClasses} disabled={isLoading}>
                        Отмена
                      </button>
                      <button 
                        type="button" 
                        onClick={handleSaveReviewedTransactions}
                        disabled={isLoading || transactionsToReview.every(t => !t.selected_dds_article_id || t.selected_dds_article_id === 0)} // Блокируем, если нечего сохранять
                        className={greenButtonClasses}
                      >
                        <CheckCircleIcon className="-ml-1 h-5 w-5 mr-2"/>
                        {isLoading ? 'Сохранение...' : 'Сохранить классифицированные'}
                      </button>
                    </div>
                  </div>
                )} 
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}

export default StatementUploadModal;