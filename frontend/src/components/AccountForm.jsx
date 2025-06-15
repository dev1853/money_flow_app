// frontend/src/components/AccountForm.jsx
import { useState, useEffect } from 'react';
import Alert from './Alert';
import { apiService, ApiError } from '../services/apiService';
import Input from './forms/Input';
import Label from './forms/Label';
import Select from './forms/Select';


function AccountForm({
  formId,
  onAccountActionSuccess,
  accountToEdit
}) {
  const [name, setName] = useState('');
  const [accountType, setAccountType] = useState('bank_account');
  const [currency, setCurrency] = useState('RUB');
  const [initialBalance, setInitialBalance] = useState('0.00');
  const [isActive, setIsActive] = useState(true);

  const [submitError, setSubmitError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const isEditMode = Boolean(accountToEdit);

  const PREDEFINED_CURRENCIES = [
    { code: 'RUB', name: 'Российский рубль' },
    { code: 'USD', name: 'Доллар США' },
    { code: 'EUR', name: 'Евро' },
    { code: 'GBP', name: 'Британский фунт стерлингов' },
    { code: 'CNY', name: 'Китайский юань' },
    { code: 'BYN', name: 'Белорусский рубль' },
    { code: 'KZT', name: 'Казахстанский тенге' },
  ];

  useEffect(() => {
    if (isEditMode && accountToEdit) {
      setName(accountToEdit.name);
      setAccountType(accountToEdit.account_type);
      setCurrency(accountToEdit.currency || PREDEFINED_CURRENCIES[0]?.code || 'RUB');
      setInitialBalance(parseFloat(accountToEdit.initial_balance).toFixed(2));
      setIsActive(accountToEdit.is_active);
    } else {
      setName('');
      setAccountType('bank_account');
      setCurrency(PREDEFINED_CURRENCIES[0]?.code || 'RUB');
      setInitialBalance('0.00');
      setIsActive(true);
    }
  }, [accountToEdit, isEditMode]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setSubmitError(null);

    const balanceValue = parseFloat(initialBalance);
    if (isNaN(balanceValue)) {
      setSubmitError("Начальный баланс должен быть числом.");
      setIsLoading(false);
      return;
    }

    const payload = {
     name: name,
     account_type: accountType,
     currency: currency,
     initial_balance: balanceValue,
     is_active: isActive,
    };

    try {
      if (isEditMode) {
        await apiService.put(`/accounts/${accountToEdit.id}`, payload);
      } else {
        await apiService.post('/accounts/', payload);
      }

      if (onAccountActionSuccess) {
        onAccountActionSuccess();
      }

    } catch (err) {
      console.error("Ошибка при отправке формы счета:", err);
      if (err instanceof ApiError) {
        setSubmitError(err.message || `Не удалось ${isEditMode ? 'обновить' : 'создать'} счет.`);
      } else {
        setSubmitError("Произошла неизвестная ошибка.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form id={formId} onSubmit={handleSubmit} className="space-y-4">
      {submitError && <Alert type="error" message={submitError} className="mb-3" />}

      <div>
        <Label htmlFor={`${formId}-accountName`}>Наименование</Label>
        <Input type="text" id={`${formId}-accountName`} value={name} onChange={(e) => setName(e.target.value)} required /> {/* Убраны дублирующиеся классы */}
      </div>

      <div>
        <Label htmlFor={`${formId}-accountType`}>Тип счета</Label>
        <Select id={`${formId}-accountType`} value={accountType} onChange={(e) => setAccountType(e.target.value)}> {/* Убраны дублирующиеся классы */}
          <option value="bank_account">Банковский счет</option>
          <option value="cash_box">Наличная касса (СЕЙФ)</option>
        </Select>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor={`${formId}-currency`}>Валюта</Label>
          <Select
            id={`${formId}-currency`}
            value={currency}
            onChange={(e) => setCurrency(e.target.value)}
            required
            // Убраны дублирующиеся классы
          >
            {PREDEFINED_CURRENCIES.map(curr => (
              <option key={curr.code} value={curr.code}>
                {curr.code} - {curr.name}
              </option>
            ))}
          </Select>
        </div>
        <div>
          <Label htmlFor={`${formId}-initialBalance`}>Начальный остаток</Label>
          <Input type="number" id={`${formId}-initialBalance`} value={initialBalance} onChange={(e) => setInitialBalance(e.target.value)} step="0.01" required /> {/* Убраны дублирующиеся классы */}
        </div>
      </div>

      {isEditMode && (
        <div className="flex items-center">
          {/* Для checkbox оставляем input, т.к. отдельного компонента Checkbox нет */}
          <input id={`${formId}-isActive`} name="isActive" type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)}
                 className="h-4 w-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"/>
          <Label htmlFor={`${formId}-isActive`} className="ml-2">Счет активен</Label>
        </div>
      )}
    </form>
  );
}

export default AccountForm;