// src/components/AccountForm.jsx
import { useState, useEffect } from 'react';

function AccountForm({ onAccountActionSuccess, accountToEdit, onCancelEdit }) {
  const [name, setName] = useState('');
  const [accountType, setAccountType] = useState('bank_account'); // Тип по умолчанию
  const [currency, setCurrency] = useState('RUB'); // Валюта по умолчанию
  const [initialBalance, setInitialBalance] = useState('0.00'); // Храним как строку для input type="number"
  const [isActive, setIsActive] = useState(true); // По умолчанию активен
  
  const [submitError, setSubmitError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const isEditMode = Boolean(accountToEdit);

  useEffect(() => {
    if (isEditMode && accountToEdit) {
      setName(accountToEdit.name);
      setAccountType(accountToEdit.account_type);
      setCurrency(accountToEdit.currency);
      // Pydantic Decimal преобразуется в строку при передаче через JSON,
      // или если это число, преобразуем в строку с 2 знаками после запятой
      setInitialBalance(parseFloat(accountToEdit.initial_balance).toFixed(2)); 
      setIsActive(accountToEdit.is_active);
    } else {
      // Сброс формы для режима создания
      setName('');
      setAccountType('bank_account');
      setCurrency('RUB');
      setInitialBalance('0.00');
      setIsActive(true);
    }
  }, [accountToEdit, isEditMode]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setSubmitError(null);

    // Проверка, что начальный баланс - это число
    const balanceValue = parseFloat(initialBalance);
    if (isNaN(balanceValue)) {
      setSubmitError("Начальный баланс должен быть числом.");
      setIsLoading(false);
      return;
    }

    const payload = {
      name,
      account_type: accountType,
      currency: currency.toUpperCase(), // Валюту приводим к верхнему регистру
      initial_balance: balanceValue, // Отправляем как число
      is_active: isActive,
    };

    const url = isEditMode 
      ? `http://localhost:8000/accounts/${accountToEdit.id}` 
      : 'http://localhost:8000/accounts/';
    const method = isEditMode ? 'PUT' : 'POST';

    try {
      const response = await fetch(url, {
        method: method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ detail: `Не удалось ${isEditMode ? 'обновить' : 'создать'} счет` }));
        throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
      }
      
      if (onAccountActionSuccess) { 
        onAccountActionSuccess(); // Эта функция вызовет закрытие модалки и обновление списка в AccountsPage
      }
      // Форма сбросится автоматически при закрытии модалки из-за смены key или сброса editingAccount

    } catch (err) {
      setSubmitError(err.message);
      console.error("Ошибка при отправке формы счета:", err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold text-gray-800">
          {isEditMode ? `Редактировать: ${accountToEdit?.name}` : 'Добавить новый счет/кассу'}
        </h2>
        {isEditMode && (
          <button type="button" onClick={onCancelEdit} className="text-sm text-gray-600 hover:text-gray-800">
            Отмена
          </button>
        )}
      </div>

      {submitError && <p className="text-red-600 bg-red-100 p-3 rounded-md text-sm">{submitError}</p>}

      <div>
        <label htmlFor="accountName" className="block text-sm font-medium text-gray-700 mb-1">Наименование</label>
        <input type="text" id="accountName" value={name} onChange={(e) => setName(e.target.value)} required
               className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"/>
      </div>

      <div>
        <label htmlFor="accountType" className="block text-sm font-medium text-gray-700 mb-1">Тип счета</label>
        <select id="accountType" value={accountType} onChange={(e) => setAccountType(e.target.value)}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500">
          <option value="bank_account">Банковский счет</option>
          <option value="cash_box">Наличная касса (СЕЙФ)</option>
        </select>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="currency" className="block text-sm font-medium text-gray-700 mb-1">Валюта (3 буквы)</label>
          <input type="text" id="currency" value={currency} onChange={(e) => setCurrency(e.target.value.toUpperCase())} maxLength="3" required
                 placeholder="RUB"
                 className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"/>
        </div>
        <div>
          <label htmlFor="initialBalance" className="block text-sm font-medium text-gray-700 mb-1">Начальный остаток</label>
          <input type="number" id="initialBalance" value={initialBalance} onChange={(e) => setInitialBalance(e.target.value)} step="0.01" required
                 className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"/>
        </div>
      </div>
      
      {/* Поле is_active имеет смысл показывать только при редактировании */}
      {isEditMode && (
        <div className="flex items-center">
          <input id="isActive" name="isActive" type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)}
                 className="h-4 w-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"/>
          <label htmlFor="isActive" className="ml-2 block text-sm text-gray-900">Счет активен</label>
        </div>
      )}

      <div className="pt-2">
        <button type="submit" disabled={isLoading}
                className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-gray-400">
          {isLoading ? (isEditMode ? 'Сохранение...' : 'Создание...') : (isEditMode ? 'Сохранить изменения' : 'Создать счет/кассу')}
        </button>
      </div>
    </form>
  );
}

export default AccountForm;