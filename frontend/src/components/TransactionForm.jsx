// src/components/TransactionForm.jsx
import { useState, useEffect, useCallback } from 'react';
import { format, parseISO } from 'date-fns';
import { useAuth } from '../contexts/AuthContext';

function TransactionForm({ 
  onTransactionProcessed, // Общий колбэк для создания/обновления
  transactionToEdit, 
  operationType, 
  onCancelEdit 
}) {
  const [transactionDate, setTransactionDate] = useState('');
  const [amount, setAmount] = useState('');
  const [accountId, setAccountId] = useState('');
  const [ddsArticleId, setDdsArticleId] = useState('');
  const [description, setDescription] = useState('');
  const [contractor, setContractor] = useState('');
  const [employeeForReport, setEmployeeForReport] = useState(''); 
  
  const [availableAccounts, setAvailableAccounts] = useState([]);
  const [availableArticlesAll, setAvailableArticlesAll] = useState([]);
  const [availableUsers, setAvailableUsers] = useState([]);
  const [fetchError, setFetchError] = useState(null);
  
  const [submitError, setSubmitError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const isEditMode = Boolean(transactionToEdit); 
  const [selectedAccountType, setSelectedAccountType] = useState(null);

  const { token, isAuthenticated } = useAuth();

  const commonLabelClasses = "block text-sm font-medium text-gray-700 mb-1";
  const commonInputClasses = "mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm h-10";

  const fetchFormData = useCallback(async () => {
    if (!isAuthenticated || !token) {
      setFetchError("Аутентификация не пройдена. Невозможно загрузить справочники.");
      return;
    }
    
    let errors = [];
    setFetchError(null);
    const headers = { 'Authorization': `Bearer ${token}` };

    try {
      const accountsResponse = await fetch('http://localhost:8000/accounts/?limit=500&is_active=true', { headers });
      if (!accountsResponse.ok) throw new Error('Ошибка загрузки счетов');
      const accountsData = await accountsResponse.json();
      setAvailableAccounts(accountsData);
    } catch (err) { errors.push(`Счета: ${err.message}`); }

    try {
      const articlesResponse = await fetch('http://localhost:8000/articles/', { headers });
      if (!articlesResponse.ok) throw new Error('Ошибка загрузки статей ДДС');
      const articlesData = await articlesResponse.json();
      const flattenArticles = (articles, level = 0) => {
        let flatList = [];
        articles.forEach(article => {
          // Показываем архивированные, если они уже выбраны в режиме редактирования
          if (!article.is_archived || (isEditMode && transactionToEdit && transactionToEdit.dds_article_id === article.id)) {
            flatList.push({ ...article, displayName: `${'—'.repeat(level)} ${article.name}` });
          }
          if (article.children && article.children.length > 0) {
            flatList = flatList.concat(flattenArticles(article.children, level + 1));
          }
        });
        return flatList;
      };
      setAvailableArticlesAll(flattenArticles(articlesData));
    } catch (err) { errors.push(`Статьи ДДС: ${err.message}`); }

    try {
      const usersResponse = await fetch('http://localhost:8000/users/?limit=500', { headers });
      if (!usersResponse.ok) throw new Error('Ошибка загрузки пользователей');
      const usersData = await usersResponse.json();
      setAvailableUsers(usersData.filter(user => user.is_active));
    } catch (err) { errors.push(`Пользователи: ${err.message}`); }

    if (errors.length > 0) {
      setFetchError(errors.join('; '));
      console.error("TransactionForm: Ошибки загрузки данных:", errors.join('; '));
    }
  }, [token, isAuthenticated, isEditMode, transactionToEdit]);

  useEffect(() => {
    fetchFormData();
  }, [fetchFormData]);

  const filteredDdsArticles = availableArticlesAll.filter(article => {
    // В режиме редактирования, operationType берется из transactionToEdit.dds_article.article_type
    const typeForFilter = isEditMode && transactionToEdit?.dds_article 
                          ? transactionToEdit.dds_article.article_type 
                          : operationType;
    if (!typeForFilter) return true; // Если тип не определен (например, форма еще не инициализирована), показываем все
    return article.article_type && article.article_type === typeForFilter;
  });
  
  useEffect(() => {
    if (isEditMode && transactionToEdit) {
      setTransactionDate(transactionToEdit.transaction_date ? format(parseISO(transactionToEdit.transaction_date), 'yyyy-MM-dd') : '');
      setAmount(String(parseFloat(transactionToEdit.amount).toFixed(2)));
      setAccountId(String(transactionToEdit.account_id));
      setDdsArticleId(String(transactionToEdit.dds_article_id));
      setDescription(transactionToEdit.description || '');
      setContractor(transactionToEdit.contractor || '');
      setEmployeeForReport(transactionToEdit.employee || ''); 
    } else { // Режим создания
      setTransactionDate(format(new Date(), 'yyyy-MM-dd'));
      setAmount('');
      setAccountId('');
      setDdsArticleId(''); 
      setDescription('');
      setContractor('');
      setEmployeeForReport('');
    }
  }, [transactionToEdit, isEditMode]);
  
  // Сброс ddsArticleId, если он не соответствует operationType (только в режиме создания)
  useEffect(() => {
    if (!isEditMode && operationType) {
        const currentArticleIsValidForType = filteredDdsArticles.some(art => art.id.toString() === ddsArticleId);
        if (ddsArticleId && !currentArticleIsValidForType) {
             setDdsArticleId('');
        }
    }
  }, [operationType, ddsArticleId, filteredDdsArticles, isEditMode]);


  useEffect(() => {
    if (accountId && availableAccounts.length > 0) {
      const selectedAcc = availableAccounts.find(acc => acc.id === parseInt(accountId));
      setSelectedAccountType(selectedAcc ? selectedAcc.account_type : null);
      if (selectedAcc && selectedAcc.account_type !== 'cash_box') {
        setEmployeeForReport('');
      }
    } else {
      setSelectedAccountType(null);
      setEmployeeForReport('');
    }
  }, [accountId, availableAccounts]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setSubmitError(null);

    if (!token) { 
      setSubmitError("Ошибка аутентификации: токен не найден. Пожалуйста, войдите снова.");
      setIsLoading(false);
      return;
    }

    let payload;
    let url;
    let method;

    if (isEditMode) {
      if (!transactionToEdit || !transactionToEdit.id) {
        setSubmitError("Ошибка: ID редактируемой транзакции не найден.");
        setIsLoading(false);
        return;
      }
      if (!ddsArticleId) { 
        setSubmitError("Необходимо выбрать статью ДДС."); 
        setIsLoading(false); 
        return; 
      }
      payload = {
        dds_article_id: parseInt(ddsArticleId, 10),
        description: description || null,
        contractor: contractor || null,
      };
      url = `http://localhost:8000/transactions/${transactionToEdit.id}/`;
      method = 'PUT';
    } else {
      const amountValue = parseFloat(amount);
      if (isNaN(amountValue) || amountValue <= 0) { 
        setSubmitError("Сумма должна быть положительным числом."); 
        setIsLoading(false); return; 
      }
      if (!accountId) { setSubmitError("Необходимо выбрать счет/кассу."); setIsLoading(false); return; }
      if (!ddsArticleId) { setSubmitError("Необходимо выбрать статью ДДС."); setIsLoading(false); return; }
      
      payload = {
        transaction_date: transactionDate,
        amount: amountValue,
        description: description || null,
        contractor: contractor || null,
        employee: selectedAccountType === 'cash_box' && employeeForReport ? employeeForReport : null,
        account_id: parseInt(accountId, 10),
        dds_article_id: parseInt(ddsArticleId, 10),
      };
      url = 'http://localhost:8000/transactions/';
      method = 'POST';
    }

    try {
      const headers = { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` };
      const response = await fetch(url, { method, headers, body: JSON.stringify(payload) });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ detail: `Не удалось ${isEditMode ? 'обновить' : 'создать'} операцию` }));
        if (response.status === 401) { throw new Error(errorData.detail || 'Ошибка аутентификации.'); }
        throw new Error(errorData.detail || `HTTP error! status: ${response.status} - ${response.statusText}`);
      }
      
      if (onTransactionProcessed) onTransactionProcessed();
      
      if(!isEditMode) {
        setTransactionDate(format(new Date(), 'yyyy-MM-dd'));
        setAmount('');
        // setAccountId(''); // Можно оставить для удобства
        setDdsArticleId(''); 
        setDescription('');
        setContractor('');
        setEmployeeForReport(''); 
      }
    } catch (err) {
      setSubmitError(err.message);
      console.error("TransactionForm: Ошибка при отправке:", err);
    } finally {
      setIsLoading(false);
    }
  };

  // Определяем, какой тип операции для плейсхолдера статей ДДС
  let currentOperationTypeForPlaceholder = operationType;
  if (isEditMode && transactionToEdit && transactionToEdit.dds_article) {
    currentOperationTypeForPlaceholder = transactionToEdit.dds_article.article_type;
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="flex justify-between items-start"> {/* items-start чтобы кнопка Отмена не прыгала */}
        <h2 className="text-xl font-semibold text-gray-800">
          {isEditMode 
            ? `Редактировать категорию ID: ${transactionToEdit?.id}` 
            : (operationType === 'income' ? "Новый доход" : "Новый расход")}
        </h2>
        {isEditMode && onCancelEdit && ( 
          <button 
            type="button" 
            onClick={onCancelEdit} 
            className="text-sm text-gray-500 hover:text-gray-700 ml-auto"
          >
            Отмена
          </button>
        )}
      </div>

      {submitError && <p className="text-sm text-red-600 bg-red-100 p-3 rounded-md">{submitError}</p>}
      {fetchError && <p className="text-sm text-orange-600 bg-orange-100 p-3 rounded-md">Ошибка загрузки справочников: {fetchError}</p>}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label htmlFor="transactionDate-form" className={commonLabelClasses}>Дата</label>
          <input type="date" id="transactionDate-form" value={transactionDate} 
                 onChange={(e) => !isEditMode && setTransactionDate(e.target.value)}
                 required disabled={isEditMode} className={`${commonInputClasses} ${isEditMode ? 'bg-gray-100 cursor-not-allowed' : ''}`}/>
        </div>
        <div>
          <label htmlFor="amount-form" className={commonLabelClasses}>Сумма</label>
          <input type="number" id="amount-form" value={amount} 
                 onChange={(e) => !isEditMode && setAmount(e.target.value)}
                 step="0.01" placeholder="0.00" required disabled={isEditMode} className={`${commonInputClasses} ${isEditMode ? 'bg-gray-100 cursor-not-allowed' : ''}`}/>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label htmlFor="accountId-form" className={commonLabelClasses}>Счет / Касса</label>
          <select id="accountId-form" value={accountId} 
                  onChange={(e) => !isEditMode && setAccountId(e.target.value)}
                  required disabled={isEditMode} className={`${commonInputClasses} ${isEditMode ? 'bg-gray-100 cursor-not-allowed' : ''}`}>
            <option value="" disabled={!isEditMode}>-- Выберите счет --</option> {/* Позволяем пустое значение если не редактируем */}
            {availableAccounts.map(acc => <option key={acc.id} value={acc.id}>{acc.name} ({acc.currency})</option>)}
          </select>
        </div>
        <div>
          <label htmlFor="ddsArticleId-form" className={commonLabelClasses}>Статья ДДС</label>
          <select id="ddsArticleId-form" value={ddsArticleId} onChange={(e) => setDdsArticleId(e.target.value)} required className={commonInputClasses}>
            <option value="" disabled>-- Выберите статью ({currentOperationTypeForPlaceholder === 'income' ? 'дохода' : 'расхода'}) --</option>
            {filteredDdsArticles.map(art => 
              <option 
                key={art.id} 
                value={art.id} 
                disabled={art.children && art.children.length > 0 && art.id.toString() !== ddsArticleId} // Разрешаем выбранный раздел, но не другие разделы
              >
                {art.displayName} {art.is_archived && art.id.toString() !== ddsArticleId ? '(архив)' : ''}
              </option>
            )}
          </select>
        </div>
      </div>
      
      <div>
        <label htmlFor="description-form" className={commonLabelClasses}>Описание</label>
        <textarea id="description-form" value={description} onChange={(e) => setDescription(e.target.value)} rows="2" className={commonInputClasses.replace('h-10', 'py-2')}/>
      </div>
      
      {selectedAccountType === 'cash_box' && (
        <div>
          <label htmlFor="employeeForReport-form" className={commonLabelClasses}>Сотрудник (для отчета, по кассе)</label>
          <select 
            id="employeeForReport-form" 
            value={employeeForReport} 
            onChange={(e) => !isEditMode && setEmployeeForReport(e.target.value)}
            disabled={isEditMode}
            className={`${commonInputClasses} ${isEditMode ? 'bg-gray-100 cursor-not-allowed' : ''}`}
          >
            <option value="">-- Не указан --</option>
            {availableUsers.map(user => <option key={user.id} value={user.full_name || user.username}>{user.full_name || user.username}</option>)}
          </select>
        </div>
      )}

      <div>
        <label htmlFor="contractor-form" className={commonLabelClasses}>Контрагент</label>
        <input type="text" id="contractor-form" value={contractor} onChange={(e) => setContractor(e.target.value)} className={commonInputClasses}/>
      </div>

      <div className="pt-2 flex justify-end space-x-3">
        {onCancelEdit && ( // Показываем кнопку Отмена, если передан onCancelEdit (обычно в режиме редактирования)
             <button 
                type="button" 
                onClick={onCancelEdit}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Отмена
            </button>
        )}
        <button type="submit" disabled={isLoading || !isAuthenticated}
                className="inline-flex items-center justify-center px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-md shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-70">
          {isLoading ? 'Сохранение...' : (isEditMode ? 'Сохранить изменения' : (operationType === 'income' ? "Добавить доход" : "Добавить расход"))}
        </button>
      </div>
    </form>
  );
}

export default TransactionForm;