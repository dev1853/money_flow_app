// frontend/src/components/TransactionForm.jsx
import { useState, useEffect, useCallback } from 'react';
import { format, parseISO } from 'date-fns';
import { useAuth } from '../contexts/AuthContext';

import Alert from './Alert';
import { apiService, ApiError } from '../services/apiService';
import Loader from './Loader';
import Input from './forms/Input';
import Label from './forms/Label';
import Select from './forms/Select';
import Textarea from './forms/Textarea';

function TransactionForm({
  formId,
  onTransactionProcessed,
  transactionToEdit,
  operationType
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
  
  const [isFormDataLoading, setIsFormDataLoading] = useState(false);
  const [fetchError, setFetchError] = useState(null);

  const [submitError, setSubmitError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const isEditMode = Boolean(transactionToEdit);
  const [selectedAccountType, setSelectedAccountType] = useState(null);

  const { isAuthenticated, activeWorkspace } = useAuth();

  const fetchFormData = useCallback(async () => {
    if (!isAuthenticated || !activeWorkspace) {
      setFetchError("Рабочее пространство не выбрано или аутентификация не пройдена. Невозможно загрузить справочники.");
      return;
    }
    setIsFormDataLoading(true);
    let errors = [];
    setFetchError(null);

    try {
      const accountsData = await apiService.get(`/accounts/?workspace_id=${activeWorkspace.id}&limit=500&is_active=true`);
      setAvailableAccounts(accountsData);
    } catch (err) { errors.push(`Счета: ${err.message}`); }

    try {
      const articlesDataRaw = await apiService.get(`/dds_articles?workspace_id=${activeWorkspace.id}`);
      const articlesData = Array.isArray(articlesDataRaw) ? articlesDataRaw : [];
      const flattenArticles = (articles, level = 0) => {
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
      setAvailableArticlesAll(flattenArticles(articlesData));
    } catch (err) { errors.push(`Статьи ДДС: ${err.message}`); }

    try {
      const usersDataRaw = await apiService.get('/users/?limit=500');
      const usersList = usersDataRaw.results || usersDataRaw || [];
      setAvailableUsers(usersList.filter(user => user.is_active));
    } catch (err) { errors.push(`Пользователи: ${err.message}`); }

    if (errors.length > 0) {
      setFetchError(errors.join('; '));
      console.error("TransactionForm: Ошибки загрузки данных:", errors.join('; '));
    }
    setIsFormDataLoading(false);
  }, [isAuthenticated, isEditMode, transactionToEdit, activeWorkspace]);

  useEffect(() => {
    fetchFormData();
  }, [fetchFormData]);

  useEffect(() => {
    if (isEditMode && transactionToEdit) {
      setTransactionDate(transactionToEdit.transaction_date ? format(parseISO(transactionToEdit.transaction_date), 'yyyy-MM-dd') : '');
      setAmount(transactionToEdit.amount.toFixed(2));
      setAccountId(transactionToEdit.account_id.toString());
      setDdsArticleId(transactionToEdit.dds_article_id.toString());
      setDescription(transactionToEdit.description || '');
      setContractor(transactionToEdit.contractor || '');
      setEmployeeForReport(transactionToEdit.employee || '');
    } else {
      setTransactionDate(format(new Date(), 'yyyy-MM-dd'));
      setAmount('');
      setAccountId('');
      setDdsArticleId('');
      setDescription('');
      setContractor('');
      setEmployeeForReport('');
    }
  }, [transactionToEdit, isEditMode]);

  const filteredDdsArticles = availableArticlesAll.filter(article => {
    const isCurrentTransactionArticle = isEditMode && transactionToEdit?.dds_article_id === article.id;
    const hasChildren = article.children && article.children.length > 0;
    const isDisabledParent = hasChildren && !isCurrentTransactionArticle;

    if (article.is_archived && !isCurrentTransactionArticle) {
        return false;
    }
    
    return (article.article_type === operationType || isCurrentTransactionArticle) && !isDisabledParent;
});


  useEffect(() => {
    if (ddsArticleId) {
      const selectedArticle = availableArticlesAll.find(art => art.id.toString() === ddsArticleId);
      if (selectedArticle && selectedArticle.article_type !== operationType) {
        setDdsArticleId('');
      }
    }
    if (!isEditMode && !ddsArticleId && filteredDdsArticles.length > 0) {
    }
  }, [operationType, ddsArticleId, filteredDdsArticles, isEditMode, availableArticlesAll]);


  useEffect(() => {
    const account = availableAccounts.find(acc => acc.id.toString() === accountId);
    if (account) {
      setSelectedAccountType(account.account_type);
    } else {
      setSelectedAccountType(null);
    }
  }, [accountId, availableAccounts]);


  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setSubmitError(null);

    if (!isAuthenticated) {
        setSubmitError("Ошибка аутентификации. Пожалуйста, войдите снова.");
        setIsLoading(false);
        return;
    }

    if (!activeWorkspace) {
        setSubmitError("Рабочее пространство не выбрано.");
        setIsLoading(false);
        return;
    }

    let payload;
    let endpoint;
    let methodType;

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
        workspace_id: activeWorkspace.id,
      };
      endpoint = `/transactions/${transactionToEdit.id}/`;
      methodType = 'put';
    } else {
      const amountValue = parseFloat(amount);
      if (isNaN(amountValue) || amountValue <= 0) {
        setSubmitError("Сумма должна быть положительным числом.");
        setIsLoading(false);
        return;
      }
      if (!accountId) {
        setSubmitError("Необходимо выбрать счет/кассу.");
        setIsLoading(false);
        return;
      }
      if (!ddsArticleId) {
        setSubmitError("Необходимо выбрать статью ДДС.");
        setIsLoading(false);
        return;
      }

      payload = {
        transaction_date: transactionDate,
        amount: amountValue,
        description: description || null,
        contractor: contractor || null,
        employee: selectedAccountType === 'cash_box' && employeeForReport ? employeeForReport : null,
        account_id: parseInt(accountId, 10),
        dds_article_id: parseInt(ddsArticleId, 10),
        workspace_id: activeWorkspace.id,
      };
      endpoint = '/transactions/';
      methodType = 'post';
    }

    try {
      if (methodType === 'put') {
        await apiService.put(endpoint, payload);
      } else {
        await apiService.post(endpoint, payload);
      }

      if (onTransactionProcessed) onTransactionProcessed();

      if(!isEditMode) {
        setTransactionDate(format(new Date(), 'yyyy-MM-dd'));
        setAmount('');
        setAccountId('');
        setDdsArticleId('');
        setDescription('');
        setContractor('');
        setEmployeeForReport('');
      }
    } catch (err) {
      console.error("TransactionForm: Ошибка при отправке:", err);
      if (err instanceof ApiError) {
        setSubmitError(err.message || `Не удалось ${isEditMode ? 'обновить' : 'создать'} операцию.`);
      } else {
        setSubmitError("Произошла неизвестная ошибка.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  let currentOperationTypeForPlaceholder = operationType;
  if (isEditMode && transactionToEdit && transactionToEdit.dds_article) {
    currentOperationTypeForPlaceholder = transactionToEdit.dds_article.article_type;
  }

  return (
    <form id={formId} onSubmit={handleSubmit} className="space-y-4">
      {submitError && <Alert type="error" message={submitError} className="my-2" />}
      {fetchError && <Alert type="warning" title="Ошибка загрузки справочников" message={fetchError} className="my-2" />}
      {isFormDataLoading && <Loader message="Загрузка справочников..." containerClassName="py-4" />}

      {!isFormDataLoading && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor={`${formId}-transactionDate`}>Дата</Label>
              <Input
                type="date"
                id={`${formId}-transactionDate`}
                value={transactionDate}
                onChange={(e) => !isEditMode && setTransactionDate(e.target.value)}
                required
                disabled={isEditMode}
                className={isEditMode ? 'bg-gray-100 cursor-not-allowed' : ''}
              />
            </div>
            <div>
              <Label htmlFor={`${formId}-amount`}>Сумма</Label>
              <Input
                type="number"
                id={`${formId}-amount`}
                value={amount}
                onChange={(e) => !isEditMode && setAmount(e.target.value)}
                step="0.01"
                placeholder="0.00"
                required
                disabled={isEditMode}
                className={isEditMode ? 'bg-gray-100 cursor-not-allowed' : ''}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor={`${formId}-accountId`}>Счет / Касса</Label>
              <Select
                id={`${formId}-accountId`}
                value={accountId}
                onChange={(e) => !isEditMode && setAccountId(e.target.value)}
                required
                disabled={isEditMode || availableAccounts.length === 0}
                className={isEditMode ? 'bg-gray-100 cursor-not-allowed' : ''} // Передаем классы через className проп
              >
                <option value="" disabled={!isEditMode}>
                  {availableAccounts.length === 0 ? "Нет счетов" : "-- Выберите счет --"}
                </option>
                {availableAccounts.map(acc => <option key={acc.id} value={acc.id}>{acc.name} ({acc.currency})</option>)}
              </Select>
            </div>
            <div>
              <Label htmlFor={`${formId}-ddsArticleId`}>Статья ДДС</Label>
              <Select
                id={`${formId}-ddsArticleId`}
                value={ddsArticleId}
                onChange={(e) => setDdsArticleId(e.target.value)}
                required
                disabled={filteredDdsArticles.length === 0}
                // Убраны дублирующиеся классы, останется только то, что передано в className проп,
                // если что-то нужно добавить поверх базовых стилей Select
              >
                <option value="" disabled>
                  {filteredDdsArticles.length === 0 ? "Нет статей" : `-- Выберите статью (${currentOperationTypeForPlaceholder === 'income' ? 'дохода' : 'расхода'}) --`}
                </option>
                {filteredDdsArticles.map(art => (
                    <option key={art.id} value={art.id} disabled={art.children && art.children.length > 0 && art.id.toString() !== ddsArticleId}>
                        {art.displayName} {art.is_archived && art.id.toString() !== ddsArticleId ? '(архив)' : ''}
                    </option>
                ))}
              </Select>
            </div>
          </div>

          <div>
            <Label htmlFor={`${formId}-description`}>Описание</Label>
            <Textarea
              id={`${formId}-description`}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows="2"
              className="py-2" // Оставляем только те классы, которые специфичны для этого Textarea (например, py-2, если h-10 было в старом Input, но у Textarea нет h-10)
            />
          </div>

          {selectedAccountType === 'cash_box' && (
            <div>
              <Label htmlFor={`${formId}-employeeForReport`}>Сотрудник (для отчета, по кассе)</Label>
              <Select
                id={`${formId}-employeeForReport`}
                value={employeeForReport}
                onChange={(e) => !isEditMode && setEmployeeForReport(e.target.value)}
                disabled={isEditMode || availableUsers.length === 0}
                className={isEditMode ? 'bg-gray-100 cursor-not-allowed' : ''} // Передаем классы через className проп
              >
                <option value="">{availableUsers.length === 0 ? "Нет пользователей" : "-- Не указан --"}</option>
                {availableUsers.map(user => <option key={user.id} value={user.full_name || user.username}>{user.full_name || user.username}</option>)}
              </Select>
            </div>
          )}

          <div>
            <Label htmlFor={`${formId}-contractor`}>Контрагент</Label>
            <Input
              type="text"
              id={`${formId}-contractor`}
              value={contractor}
              onChange={(e) => setContractor(e.target.value)}
              // Убраны дублирующиеся классы
            />
          </div>
        </>
      )}
    </form>
  );
}

export default TransactionForm;