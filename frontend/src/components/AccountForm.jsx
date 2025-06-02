// frontend/src/components/AccountForm.jsx
import { useState, useEffect } from 'react';
import Button from './Button';
import Alert from './Alert';
import { API_BASE_URL } from '../apiConfig';
import { useAuth } from '../contexts/AuthContext'; // <--- ДОБАВЛЕН ИМПОРТ useAuth

function AccountForm({ onAccountActionSuccess, accountToEdit, onCancelEdit }) {
  const [name, setName] = useState(''); //
  const [accountType, setAccountType] = useState('bank_account'); //
  const [currency, setCurrency] = useState('RUB'); //
  const [initialBalance, setInitialBalance] = useState('0.00'); //
  const [isActive, setIsActive] = useState(true); //

  const [submitError, setSubmitError] = useState(null); //
  const [isLoading, setIsLoading] = useState(false); //

  const isEditMode = Boolean(accountToEdit); //
  const { token } = useAuth(); // <--- ПОЛУЧАЕМ ТОКЕН

  useEffect(() => { //
    if (isEditMode && accountToEdit) {
      setName(accountToEdit.name); //
      setAccountType(accountToEdit.account_type); //
      setCurrency(accountToEdit.currency); //
      setInitialBalance(parseFloat(accountToEdit.initial_balance).toFixed(2)); //
      setIsActive(accountToEdit.is_active); //
    } else {
      setName(''); //
      setAccountType('bank_account'); //
      setCurrency('RUB'); //
      setInitialBalance('0.00'); //
      setIsActive(true); //
    }
  }, [accountToEdit, isEditMode]); //

  const handleSubmit = async (e) => { //
    e.preventDefault(); //
    if (!token) {
      setSubmitError("Ошибка авторизации: токен не найден.");
      return;
    }
    setIsLoading(true); //
    setSubmitError(null); //

    const balanceValue = parseFloat(initialBalance); //
    if (isNaN(balanceValue)) { //
      setSubmitError("Начальный баланс должен быть числом."); //
      setIsLoading(false); //
      return; //
    }

    const payload = { //
      name,
      account_type: accountType,
      currency: currency.toUpperCase(),
      initial_balance: balanceValue,
      is_active: isActive,
    };

    const url = isEditMode
      ? `${API_BASE_URL}/accounts/${accountToEdit.id}` //
      : `${API_BASE_URL}/accounts/`; //
    const method = isEditMode ? 'PUT' : 'POST'; //

    try {
      const headers = { // <--- ДОБАВЛЕНЫ HEADERS С ТОКЕНОМ
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      };
      const response = await fetch(url, { //
        method: method,
        headers: headers, // <--- ПЕРЕДАЕМ HEADERS
        body: JSON.stringify(payload),
      });

      if (!response.ok) { //
        const errorData = await response.json().catch(() => ({ detail: `Не удалось ${isEditMode ? 'обновить' : 'создать'} счет` }));
        throw new Error(errorData.detail || `HTTP error! status: ${response.status}`); //
      }

      if (onAccountActionSuccess) { //
        onAccountActionSuccess();
      }

    } catch (err) { //
      setSubmitError(err.message); //
      console.error("Ошибка при отправке формы счета:", err); //
    } finally {
      setIsLoading(false); //
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6"> {/* */}
      <div className="flex justify-between items-center"> {/* */}
        <h2 className="text-xl font-semibold text-gray-800"> {/* */}
          {isEditMode ? `Редактировать: ${accountToEdit?.name}` : 'Добавить новый счет/кассу'}
        </h2>
        {isEditMode && onCancelEdit && (
          <Button variant="link" size="sm" onClick={onCancelEdit}> {/* */}
            Отмена
          </Button>
        )}
      </div>

      {submitError && <Alert type="error" message={submitError} className="mb-4" />} {/* */}

      <div>
        <label htmlFor="accountName" className="block text-sm font-medium text-gray-700 mb-1">Наименование</label> {/* */}
        <input type="text" id="accountName" value={name} onChange={(e) => setName(e.target.value)} required
               className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"/> {/* */}
      </div>

      <div>
        <label htmlFor="accountType" className="block text-sm font-medium text-gray-700 mb-1">Тип счета</label> {/* */}
        <select id="accountType" value={accountType} onChange={(e) => setAccountType(e.target.value)}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"> {/* */}
          <option value="bank_account">Банковский счет</option> {/* */}
          <option value="cash_box">Наличная касса (СЕЙФ)</option> {/* */}
        </select>
      </div>

      <div className="grid grid-cols-2 gap-4"> {/* */}
        <div>
          <label htmlFor="currency" className="block text-sm font-medium text-gray-700 mb-1">Валюта (3 буквы)</label> {/* */}
          <input type="text" id="currency" value={currency} onChange={(e) => setCurrency(e.target.value.toUpperCase())} maxLength="3" required
                 placeholder="RUB"
                 className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"/> {/* */}
        </div>
        <div>
          <label htmlFor="initialBalance" className="block text-sm font-medium text-gray-700 mb-1">Начальный остаток</label> {/* */}
          <input type="number" id="initialBalance" value={initialBalance} onChange={(e) => setInitialBalance(e.target.value)} step="0.01" required
                 className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"/> {/* */}
        </div>
      </div>

      {isEditMode && ( //
        <div className="flex items-center"> {/* */}
          <input id="isActive" name="isActive" type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)}
                 className="h-4 w-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"/> {/* */}
          <label htmlFor="isActive" className="ml-2 block text-sm text-gray-900">Счет активен</label> {/* */}
        </div>
      )}

      <div className="pt-2"> {/* */}
        <Button
            type="submit"
            variant="primary"
            size="md"
            disabled={isLoading} //
            fullWidth
        >
          {isLoading ? (isEditMode ? 'Сохранение...' : 'Создание...') : (isEditMode ? 'Сохранить изменения' : 'Создать счет/кассу')} {/* */}
        </Button>
      </div>
    </form>
  );
}

export default AccountForm; //