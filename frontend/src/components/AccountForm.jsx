// frontend/src/components/AccountForm.jsx
import { useState, useEffect } from 'react';
// Button здесь больше не нужен, так как кнопки будут рендериться в Modal
import Alert from './Alert';
import { apiService, ApiError } from '../services/apiService';

// Проп onCancelEdit здесь больше не используется для внутренней кнопки "Отмена",
// так как отмена теперь обрабатывается закрытием модального окна.
// Однако, его можно оставить, если форма используется где-то еще без модального окна
// или если при закрытии модального окна нужно выполнить специфичное действие отмены.
// Для простоты, пока оставим его в props, но кнопка "Отмена" из формы убрана.
function AccountForm({
  formId, // Новый проп для ID формы
  onAccountActionSuccess,
  accountToEdit
  // onCancelEdit // Больше не используется для кнопки внутри формы
}) {
  const [name, setName] = useState(''); //
  const [accountType, setAccountType] = useState('bank_account'); //
  const [currency, setCurrency] = useState('RUB'); //
  const [initialBalance, setInitialBalance] = useState('0.00'); //
  const [isActive, setIsActive] = useState(true); //

  const [submitError, setSubmitError] = useState(null); //
  const [isLoading, setIsLoading] = useState(false); //

  const isEditMode = Boolean(accountToEdit); //

  // Статический список валют (оставляем как есть)
  const PREDEFINED_CURRENCIES = [
    { code: 'RUB', name: 'Российский рубль' },
    { code: 'USD', name: 'Доллар США' },
    { code: 'EUR', name: 'Евро' },
    { code: 'GBP', name: 'Британский фунт стерлингов' },
    { code: 'CNY', name: 'Китайский юань' },
    { code: 'BYN', name: 'Белорусский рубль' },
    { code: 'KZT', name: 'Казахстанский тенге' },
  ];

  useEffect(() => { //
    if (isEditMode && accountToEdit) {
      setName(accountToEdit.name); //
      setAccountType(accountToEdit.account_type); //
      setCurrency(accountToEdit.currency || PREDEFINED_CURRENCIES[0]?.code || 'RUB'); //
      setInitialBalance(parseFloat(accountToEdit.initial_balance).toFixed(2)); //
      setIsActive(accountToEdit.is_active); //
    } else {
      setName(''); //
      setAccountType('bank_account'); //
      setCurrency(PREDEFINED_CURRENCIES[0]?.code || 'RUB'); //
      setInitialBalance('0.00'); //
      setIsActive(true); //
    }
  }, [accountToEdit, isEditMode]); //

  const handleSubmit = async (e) => { //
    e.preventDefault(); //
    setIsLoading(true); //
    setSubmitError(null); //

    const balanceValue = parseFloat(initialBalance); //
    if (isNaN(balanceValue)) { //
      setSubmitError("Начальный баланс должен быть числом."); //
      setIsLoading(false); //
      return; //
    }

    const payload = { /* ... как было ... */ }; //
     payload.name = name; //
     payload.account_type = accountType; //
     payload.currency = currency; //
     payload.initial_balance = balanceValue; //
     payload.is_active = isActive; //


    try {
      if (isEditMode) {
        await apiService.put(`/accounts/${accountToEdit.id}`, payload); //
      } else {
        await apiService.post('/accounts/', payload); //
      }

      if (onAccountActionSuccess) { //
        onAccountActionSuccess();
      }

    } catch (err) { //
      console.error("Ошибка при отправке формы счета:", err); //
      if (err instanceof ApiError) {
        setSubmitError(err.message || `Не удалось ${isEditMode ? 'обновить' : 'создать'} счет.`);
      } else {
        setSubmitError("Произошла неизвестная ошибка.");
      }
    } finally {
      setIsLoading(false); //
    }
  };

  return (
    // Добавляем formId к тегу form
    <form id={formId} onSubmit={handleSubmit} className="space-y-4">
      {submitError && <Alert type="error" message={submitError} className="mb-3" />}

      <div>
        <label htmlFor={`${formId}-accountName`} className="block text-sm font-medium text-gray-700 mb-1">Наименование</label>
        <input type="text" id={`${formId}-accountName`} value={name} onChange={(e) => setName(e.target.value)} required
               className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"/>
      </div>

      <div>
        <label htmlFor={`${formId}-accountType`} className="block text-sm font-medium text-gray-700 mb-1">Тип счета</label>
        <select id={`${formId}-accountType`} value={accountType} onChange={(e) => setAccountType(e.target.value)}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500">
          <option value="bank_account">Банковский счет</option>
          <option value="cash_box">Наличная касса (СЕЙФ)</option>
        </select>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor={`${formId}-currency`} className="block text-sm font-medium text-gray-700 mb-1">Валюта</label>
          <select
            id={`${formId}-currency`}
            value={currency}
            onChange={(e) => setCurrency(e.target.value)}
            required
            className="mt-1 block w-full px-3 py-2 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
          >
            {PREDEFINED_CURRENCIES.map(curr => (
              <option key={curr.code} value={curr.code}>
                {curr.code} - {curr.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor={`${formId}-initialBalance`} className="block text-sm font-medium text-gray-700 mb-1">Начальный остаток</label>
          <input type="number" id={`${formId}-initialBalance`} value={initialBalance} onChange={(e) => setInitialBalance(e.target.value)} step="0.01" required
                 className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"/>
        </div>
      </div>

      {isEditMode && (
        <div className="flex items-center">
          <input id={`${formId}-isActive`} name="isActive" type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)}
                 className="h-4 w-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"/>
          <label htmlFor={`${formId}-isActive`} className="ml-2 block text-sm text-gray-900">Счет активен</label>
        </div>
      )}

      {/* БЛОК КНОПОК УДАЛЕН ОТСЮДА */}
      {/* <div className="pt-4 mt-4 border-t border-gray-200 flex justify-end space-x-3"> ... </div> */}
    </form>
  );
}

export default AccountForm;