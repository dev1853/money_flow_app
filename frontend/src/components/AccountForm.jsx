import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { apiService } from '../services/apiService';
import Button from './Button';
import Input from './forms/Input';
import Label from './forms/Label';
import Select from './forms/Select';
import Alert from './Alert';

const ACCOUNT_TYPES = [
  { value: 'bank_account', label: 'Банковский счет' },
  { value: 'cash', label: 'Наличные' },
  { value: 'safe', label: 'Сейф' },
];

const PREDEFINED_CURRENCIES = [
    { code: 'RUB', name: 'Российский рубль' },
    { code: 'USD', name: 'Доллар США' },
    { code: 'EUR', name: 'Евро' },
];

const getInitialFormData = (account) => ({
  name: account?.name || '',
  account_type: account?.account_type || 'bank_account',
  initial_balance: account?.initial_balance?.toFixed(2) || '0.00',
  currency: account?.currency || 'RUB',
  is_active: account ? account.is_active : true,
});

function AccountForm({ account, onSuccess }) {
  const { activeWorkspace, user, fetchAccounts } = useAuth();
  
  const [formData, setFormData] = useState(getInitialFormData(account));
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const isEditMode = Boolean(account);

  useEffect(() => {
    setFormData(getInitialFormData(account));
  }, [account]);
  
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');

    if (!activeWorkspace || !user) {
      setError("Не удалось определить рабочее пространство или пользователя.");
      setSubmitting(false);
      return;
    }

    try {
      // Готовим данные для отправки в соответствии со схемой бэкенда
      const dataToSend = {
        name: formData.name,
        account_type: formData.account_type,
        currency: formData.currency,
        is_active: formData.is_active,
        initial_balance: parseFloat(String(formData.initial_balance).replace(',', '.')),
        current_balance: parseFloat(String(formData.initial_balance).replace(',', '.')),
        workspace_id: activeWorkspace.id,
        owner_id: user.id, 
      };

      if (isEditMode) {
        // При обновлении не отправляем баланс, владельца и воркспейс
        delete dataToSend.initial_balance;
        delete dataToSend.current_balance;
        delete dataToSend.owner_id;
        delete dataToSend.workspace_id;
        await apiService.put(`/accounts/${account.id}`, dataToSend);
      } else {
        await apiService.post('/accounts/', dataToSend);
      }
      
      await fetchAccounts(); // Обновляем список счетов в контексте
      if (onSuccess) onSuccess();

    } catch (err) {
      console.error("Ошибка при отправке формы счета:", err);
      setError(err.message || 'Произошла неизвестная ошибка');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && <Alert type="error">{error}</Alert>}
      <div>
        <Label htmlFor="account_name">Название счета</Label>
        <Input id="account_name" name="name" value={formData.name} onChange={handleChange} required />
      </div>
      <div>
        <Label htmlFor="account_type">Тип счета</Label>
        <Select id="account_type" name="account_type" value={formData.account_type} onChange={handleChange} required>
          {ACCOUNT_TYPES.map(type => (
            <option key={type.value} value={type.value}>{type.label}</option>
          ))}
        </Select>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="currency">Валюта</Label>
          <Select id="currency" name="currency" value={formData.currency} onChange={handleChange} required>
            {PREDEFINED_CURRENCIES.map(curr => <option key={curr.code} value={curr.code}>{curr.code}</option>)}
          </Select>
        </div>
        <div>
          <Label htmlFor="initial_balance">Начальный остаток</Label>
          <Input type="number" id="initial_balance" name="initial_balance" value={formData.initial_balance} onChange={handleChange} step="0.01" required disabled={isEditMode} />
        </div>
      </div>
      {isEditMode && (
        <div className="flex items-center">
          <input id="is_active" name="is_active" type="checkbox" checked={formData.is_active} onChange={handleChange} className="h-4 w-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"/>
          <Label htmlFor="is_active" className="ml-2">Счет активен</Label>
        </div>
      )}
      <div className="flex justify-end pt-2">
        <Button type="submit" disabled={submitting}>
          {submitting ? 'Сохранение...' : (isEditMode ? 'Сохранить изменения' : 'Создать счет')}
        </Button>
      </div>
    </form>
  );
}

export default AccountForm;