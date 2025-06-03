// frontend/src/components/TransactionForm.jsx
import { useState, useEffect, useCallback } from 'react';
import { format, parseISO } from 'date-fns';
import { useAuth } from '../contexts/AuthContext'; // Нужен для isAuthenticated

// Наши новые компоненты и сервис
import Button from './Button';
import Alert from './Alert';
import { apiService, ApiError } from '../services/apiService'; 
import Loader from './Loader';// Путь из src/components до src/services

function TransactionForm({
  onTransactionProcessed,
  transactionToEdit,
  operationType,
  onCancelEdit
}) {
  const [transactionDate, setTransactionDate] = useState(''); //
  const [amount, setAmount] = useState(''); //
  const [accountId, setAccountId] = useState(''); //
  const [ddsArticleId, setDdsArticleId] = useState(''); //
  const [description, setDescription] = useState(''); //
  const [contractor, setContractor] = useState(''); //
  const [employeeForReport, setEmployeeForReport] = useState(''); //

  const [availableAccounts, setAvailableAccounts] = useState([]); //
  const [availableArticlesAll, setAvailableArticlesAll] = useState([]); //
  const [availableUsers, setAvailableUsers] = useState([]); //
  
  const [isFormDataLoading, setIsFormDataLoading] = useState(false); // Лоадер для справочников
  const [fetchError, setFetchError] = useState(null); //

  const [submitError, setSubmitError] = useState(null); //
  const [isLoading, setIsLoading] = useState(false); // Лоаder для submit

  const isEditMode = Boolean(transactionToEdit); //
  const [selectedAccountType, setSelectedAccountType] = useState(null); //

  const { isAuthenticated } = useAuth(); // Токен теперь не нужен здесь напрямую

  const commonLabelClasses = "block text-sm font-medium text-gray-700 mb-1"; //
  const commonInputClasses = "mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm h-10"; //

  const fetchFormData = useCallback(async () => { //
    if (!isAuthenticated) { // Проверяем аутентификацию перед запросом
      setFetchError("Аутентификация не пройдена. Невозможно загрузить справочники."); //
      return;
    }
    setIsFormDataLoading(true);
    let errors = []; //
    setFetchError(null); //

    try {
      const accountsData = await apiService.get('/accounts/?limit=500&is_active=true'); //
      setAvailableAccounts(accountsData); //
    } catch (err) { errors.push(`Счета: ${err.message}`); }

    try {
      const articlesDataRaw = await apiService.get('/articles/'); //
      const articlesData = Array.isArray(articlesDataRaw) ? articlesDataRaw : []; // Убедимся, что это массив
      const flattenArticles = (articles, level = 0) => { //
        let flatList = [];
        articles.forEach(article => {
          if (!article.is_archived || (isEditMode && transactionToEdit && transactionToEdit.dds_article_id === article.id)) {
            flatList.push({ ...article, displayName: `${'—'.repeat(level)} ${article.name}` });
          }
          if (article.children && article.children.length > 0) {
            flatList = flatList.concat(flattenArticles(article.children, level + 1));
          }
        });
        return flatList;
      };
      setAvailableArticlesAll(flattenArticles(articlesData)); //
    } catch (err) { errors.push(`Статьи ДДС: ${err.message}`); }

    try {
      const usersDataRaw = await apiService.get('/users/?limit=500'); //
      // Адаптируемся, если API возвращает {results: []} или просто []
      const usersList = usersDataRaw.results || usersDataRaw || []; 
      setAvailableUsers(usersList.filter(user => user.is_active)); //
    } catch (err) { errors.push(`Пользователи: ${err.message}`); }

    if (errors.length > 0) { //
      setFetchError(errors.join('; ')); //
      console.error("TransactionForm: Ошибки загрузки данных:", errors.join('; ')); //
    }
    setIsFormDataLoading(false);
  }, [isAuthenticated, isEditMode, transactionToEdit]); // Зависимости обновлены

  useEffect(() => { //
    fetchFormData();
  }, [fetchFormData]); //

  const filteredDdsArticles = availableArticlesAll.filter(article => { /* ... без изменений ... */ }); //
  useEffect(() => { /* ... логика заполнения полей ... без изменений ... */ }, [transactionToEdit, isEditMode]); //
  useEffect(() => { /* ... сброс ddsArticleId ... без изменений ... */ }, [operationType, ddsArticleId, filteredDdsArticles, isEditMode]); //
  useEffect(() => { /* ... selectedAccountType ... без изменений ... */ }, [accountId, availableAccounts]); //

  const handleSubmit = async (e) => { //
    e.preventDefault(); //
    setIsLoading(true); //
    setSubmitError(null); //

    // Проверка isAuthenticated перед отправкой (хотя кнопка должна быть disabled)
    if (!isAuthenticated) {
        setSubmitError("Ошибка аутентификации. Пожалуйста, войдите снова.");
        setIsLoading(false);
        return;
    }
    // ... остальные проверки ...
    let payload; //
    let endpoint;
    let methodType;

    if (isEditMode) { //
      // ... payload для PUT ...
      payload = { /* ... */ }; //
      endpoint = `/transactions/${transactionToEdit.id}/`; //
      methodType = 'put';
    } else { //
      // ... payload для POST ...
      payload = { /* ... */ }; //
      endpoint = '/transactions/'; //
      methodType = 'post';
    }
    
    // Код для payload остается как был в вашем файле
    if (isEditMode) {
      if (!transactionToEdit || !transactionToEdit.id) { setSubmitError("Ошибка: ID редактируемой транзакции не найден."); setIsLoading(false); return; }
      if (!ddsArticleId) {  setSubmitError("Необходимо выбрать статью ДДС.");  setIsLoading(false);  return;  }
      payload = { dds_article_id: parseInt(ddsArticleId, 10), description: description || null, contractor: contractor || null, };
    } else {
      const amountValue = parseFloat(amount);
      if (isNaN(amountValue) || amountValue <= 0) {  setSubmitError("Сумма должна быть положительным числом.");  setIsLoading(false); return;  }
      if (!accountId) { setSubmitError("Необходимо выбрать счет/кассу."); setIsLoading(false); return; }
      if (!ddsArticleId) { setSubmitError("Необходимо выбрать статью ДДС."); setIsLoading(false); return; }
      payload = { transaction_date: transactionDate, amount: amountValue, description: description || null, contractor: contractor || null, employee: selectedAccountType === 'cash_box' && employeeForReport ? employeeForReport : null, account_id: parseInt(accountId, 10), dds_article_id: parseInt(ddsArticleId, 10), };
    }


    try {
      if (methodType === 'put') {
        await apiService.put(endpoint, payload);
      } else {
        await apiService.post(endpoint, payload);
      }

      if (onTransactionProcessed) onTransactionProcessed(); //

      if(!isEditMode) { /* ... сброс полей ... */ } //
    } catch (err) { //
      console.error("TransactionForm: Ошибка при отправке:", err); //
      if (err instanceof ApiError) {
        setSubmitError(err.message || `Не удалось ${isEditMode ? 'обновить' : 'создать'} операцию.`);
      } else {
        setSubmitError("Произошла неизвестная ошибка.");
      }
    } finally {
      setIsLoading(false); //
    }
  };

  let currentOperationTypeForPlaceholder = operationType; //
  if (isEditMode && transactionToEdit && transactionToEdit.dds_article) { //
    currentOperationTypeForPlaceholder = transactionToEdit.dds_article.article_type; //
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4"> {/* */}
      <div className="flex justify-between items-start"> {/* */}
        <h2 className="text-xl font-semibold text-gray-800"> {/* */}
          {isEditMode
            ? `Редактировать категорию ID: ${transactionToEdit?.id}`
            : (operationType === 'income' ? "Новый доход" : "Новый расход")}
        </h2>
        {isEditMode && onCancelEdit && (
          <Button variant="link" size="sm" onClick={onCancelEdit} className="ml-auto"> {/* */}
            Отмена
          </Button>
        )}
      </div>

      {submitError && <Alert type="error" message={submitError} className="my-2" />} {/* */}
      {fetchError && <Alert type="warning" title="Ошибка загрузки справочников" message={fetchError} className="my-2" />} {/* */}
      {isFormDataLoading && <Loader message="Загрузка справочников..." containerClassName="py-4" />}


      {/* Поля формы остаются без изменений в JSX, кроме disabled состояния для селектов */}
      {/* Пример для селекта счетов: */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4"> {/* */}
        <div>
          <label htmlFor="transactionDate-form" className={commonLabelClasses}>Дата</label> {/* */}
          <input type="date" id="transactionDate-form" value={transactionDate}
                 onChange={(e) => !isEditMode && setTransactionDate(e.target.value)}
                 required disabled={isEditMode || isFormDataLoading} className={`${commonInputClasses} ${isEditMode ? 'bg-gray-100 cursor-not-allowed' : ''}`}/> {/* */}
        </div>
        <div>
          <label htmlFor="amount-form" className={commonLabelClasses}>Сумма</label> {/* */}
          <input type="number" id="amount-form" value={amount}
                 onChange={(e) => !isEditMode && setAmount(e.target.value)}
                 step="0.01" placeholder="0.00" required disabled={isEditMode || isFormDataLoading} className={`${commonInputClasses} ${isEditMode ? 'bg-gray-100 cursor-not-allowed' : ''}`}/> {/* */}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4"> {/* */}
        <div>
          <label htmlFor="accountId-form" className={commonLabelClasses}>Счет / Касса</label> {/* */}
          <select id="accountId-form" value={accountId}
                  onChange={(e) => !isEditMode && setAccountId(e.target.value)}
                  required disabled={isEditMode || isFormDataLoading || availableAccounts.length === 0} 
                  className={`${commonInputClasses} ${isEditMode ? 'bg-gray-100 cursor-not-allowed' : ''}`}> {/* */}
            <option value="" disabled={!isEditMode}>{isFormDataLoading ? "Загрузка..." : (availableAccounts.length === 0 ? "Нет счетов" : "-- Выберите счет --")}</option> {/* */}
            {availableAccounts.map(acc => <option key={acc.id} value={acc.id}>{acc.name} ({acc.currency})</option>)} {/* */}
          </select>
        </div>
        <div>
          <label htmlFor="ddsArticleId-form" className={commonLabelClasses}>Статья ДДС</label> {/* */}
          <select id="ddsArticleId-form" value={ddsArticleId} onChange={(e) => setDdsArticleId(e.target.value)} 
                  required disabled={isFormDataLoading || filteredDdsArticles.length === 0} 
                  className={commonInputClasses}> {/* */}
            <option value="" disabled>{isFormDataLoading ? "Загрузка..." : (filteredDdsArticles.length === 0 ? "Нет статей" : `-- Выберите статью (${currentOperationTypeForPlaceholder === 'income' ? 'дохода' : 'расхода'}) --`)}</option> {/* */}
            {filteredDdsArticles.map(art => /* ... */ <option key={art.id} value={art.id} disabled={art.children && art.children.length > 0 && art.id.toString() !== ddsArticleId} > {art.displayName} {art.is_archived && art.id.toString() !== ddsArticleId ? '(архив)' : ''} </option> )} {/* */}
          </select>
        </div>
      </div>

      <div>
        <label htmlFor="description-form" className={commonLabelClasses}>Описание</label> {/* */}
        <textarea id="description-form" value={description} onChange={(e) => setDescription(e.target.value)} rows="2" className={commonInputClasses.replace('h-10', 'py-2')} disabled={isFormDataLoading}/> {/* */}
      </div>

      {selectedAccountType === 'cash_box' && ( //
        <div>
          <label htmlFor="employeeForReport-form" className={commonLabelClasses}>Сотрудник (для отчета, по кассе)</label> {/* */}
          <select
            id="employeeForReport-form" //
            value={employeeForReport}
            onChange={(e) => !isEditMode && setEmployeeForReport(e.target.value)}
            disabled={isEditMode || isFormDataLoading || availableUsers.length === 0} //
            className={`${commonInputClasses} ${isEditMode ? 'bg-gray-100 cursor-not-allowed' : ''}`} //
          >
            <option value="">{isFormDataLoading ? "Загрузка..." : (availableUsers.length === 0 ? "Нет пользователей" : "-- Не указан --")}</option> {/* */}
            {availableUsers.map(user => <option key={user.id} value={user.full_name || user.username}>{user.full_name || user.username}</option>)} {/* */}
          </select>
        </div>
      )}

      <div>
        <label htmlFor="contractor-form" className={commonLabelClasses}>Контрагент</label> {/* */}
        <input type="text" id="contractor-form" value={contractor} onChange={(e) => setContractor(e.target.value)} className={commonInputClasses} disabled={isFormDataLoading}/> {/* */}
      </div>


      <div className="pt-2 flex justify-end space-x-3"> {/* */}
        {onCancelEdit && (
             <Button variant="secondary" size="md" onClick={onCancelEdit} disabled={isLoading || isFormDataLoading}> {/* */}
                Отмена
            </Button>
        )}
        <Button
            type="submit"
            variant="primary"
            size="md"
            disabled={isLoading || isFormDataLoading || !isAuthenticated} //
        >
          {isLoading ? 'Сохранение...' : (isEditMode ? 'Сохранить изменения' : (operationType === 'income' ? "Добавить доход" : "Добавить расход"))} {/* */}
        </Button>
      </div>
    </form>
  );
}

export default TransactionForm; //