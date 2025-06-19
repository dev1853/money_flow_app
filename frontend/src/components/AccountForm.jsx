import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { apiService } from '../services/apiService';
import Button from './Button';
import Input from './forms/Input';
import Select from './forms/Select';
import Alert from './Alert';

// --- КОНСТАНТЫ ---
// Выносим "магические" значения из JSX в именованные константы.
// Это упрощает добавление новых типов или валют в будущем.
const ACCOUNT_TYPES = [
  { value: 'bank_account', label: 'Банковский счет' },
  { value: 'cash', label: 'Наличные' },
  { value: 'safe', label: 'Наличные касса (СЕЙФ)' },
];

const PREDEFINED_CURRENCIES = [
    { code: 'RUB', name: 'Российский рубль' },
    { code: 'USD', name: 'Доллар США' },
    { code: 'EUR', name: 'Евро' },
    { code: 'CNY', name: 'Китайский юань' },
];

// --- Хелпер для инициализации состояния формы ---
// Помогает избежать дублирования кода.
const getInitialFormData = (account) => ({
  name: account?.name || '',
  account_type: account?.account_type || 'bank_account',
  initial_balance: account?.initial_balance?.toFixed(2) || '0.00',
  current_balance: account?.current_balance?.toFixed(2) || '0.00',
  currency: account?.currency || 'RUB',
  is_active: account ? account.is_active : true,
});


function AccountForm({ account, onSuccess }) {
  const { activeWorkspace, fetchAccounts } = useAuth();
  
  // --- ЕДИНОЕ СОСТОЯНИЕ ФОРМЫ ---
  const [formData, setFormData] = useState(getInitialFormData(account));
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const isEditMode = Boolean(account);

  // Этот эффект обновляет форму, если для редактирования был выбран другой счет.
  useEffect(() => {
    setFormData(getInitialFormData(account));
  }, [account]);
  
  // --- УНИВЕРСАЛЬНЫЙ ОБРАБОТЧИК ИЗМЕНЕНИЙ ---
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
        ...prev,
        [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');

    if (!activeWorkspace) {
      setError("Активное рабочее пространство не выбрано.");
      setSubmitting(false);
      return;
    }

    try {
      // Готовим данные для отправки, преобразуя баланс в число.
      const dataToSend = {
        name: formData.name,
        account_type: formData.account_type,
        currency: formData.currency,
        is_active: formData.is_active,
        initial_balance: parseFloat(String(formData.initial_balance).replace(',', '.')),
        current_balance: parseFloat(String(formData.initial_balance).replace(',', '.')),
        workspace_id: activeWorkspace.id,
      };

      if (isEditMode) {
        // В режиме редактирования не отправляем баланс, чтобы случайно его не изменить
        delete dataToSend.initial_balance;
        delete dataToSend.current_balance;
        await apiService.put(`/accounts/${account.id}`, dataToSend);
      } else {
        await apiService.post('/accounts/', dataToSend);
      }
      
      // После успешного действия обновляем глобальный список счетов и закрываем модальное окно.
      await fetchAccounts(); 
      if (onSuccess) onSuccess();

    } catch (err) {
      console.error("Ошибка при отправке формы счета:", err);
      setError(err.message || 'Произошла неизвестная ошибка');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && <Alert type="error">{error}</Alert>}
      
      <Input
        label="Название счета"
        id="name"
        name="name"
        value={formData.name}
        onChange={handleChange}
        required
      />
      
      <Select
        label="Тип счета"
        id="account_type"
        name="account_type"
        value={formData.account_type}
        onChange={handleChange}
        required
      >
        {ACCOUNT_TYPES.map(type => (
          <option key={type.value} value={type.value}>{type.label}</option>
        ))}
      </Select>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Select
          label="Валюта"
          id="currency"
          name="currency"
          value={formData.currency}
          onChange={handleChange}
          required
        >
          {PREDEFINED_CURRENCIES.map(curr => (
            <option key={curr.code} value={curr.code}>{curr.name} ({curr.code})</option>
          ))}
        </Select>
        <Input
          label="Начальный остаток"
          type="number"
          id="initial_balance"
          name="initial_balance"
          value={formData.initial_balance}
          onChange={handleChange}
          step="0.01"
          required
          disabled={isEditMode} // Запрещаем менять начальный баланс в режиме редактирования
          title={isEditMode ? "Начальный баланс нельзя изменить после создания счета" : ""}
        />
      </div>

      {isEditMode && (
        <div className="flex items-center space-x-3 pt-2">
          <input
            id="is_active"
            name="is_active"
            type="checkbox"
            checked={formData.is_active}
            onChange={handleChange}
            className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-600"
          />
          <label htmlFor="is_active" className="text-sm font-medium text-gray-700">
            Счет активен
          </label>
        </div>
      )}

      <div className="flex justify-end pt-4">
        <Button type="submit" disabled={submitting}>
          {submitting ? 'Сохранение...' : (isEditMode ? 'Сохранить изменения' : 'Создать счет')}
        </Button>
      </div>
    </form>
  );
}

export default AccountForm;