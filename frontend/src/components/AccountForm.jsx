import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { apiService } from '../services/apiService';
import { useApiMutation } from '../hooks/useApiMutation'; // <-- Импортируем наш новый хук

import Button from './Button';
import Input from './forms/Input';
import Label from './forms/Label';
import Select from './forms/Select';
import Alert from './Alert';

const ACCOUNT_TYPES = [
  { value: 'bank_account', label: 'Банковский счет' },
  { value: 'cash_box', label: 'Касса' },
];

const PREDEFINED_CURRENCIES = [
    { code: 'RUB', name: 'Российский рубль' },
    { code: 'USD', name: 'Доллар США' },
    { code: 'EUR', name: 'Евро' },
];

// Функция для валидации полей формы
const validateForm = (formData, isEditMode) => {
    const errors = {};
    if (!formData.name.trim()) {
        errors.name = 'Название счета обязательно для заполнения.';
    }
    if (!isEditMode && (!formData.initial_balance || isNaN(parseFloat(formData.initial_balance)))) {
        errors.initial_balance = 'Начальный баланс должен быть числом.';
    }
    return errors;
}

function AccountForm({ account, onSuccess }) {
  const { activeWorkspace, fetchAccounts } = useAuth();
  const [formData, setFormData] = useState({
      name: account?.name || '',
      account_type: account?.account_type || 'bank_account',
      initial_balance: account?.initial_balance || '0.00',
      currency: account?.currency || 'RUB',
      is_active: account ? account.is_active : true,
  });
  const [formErrors, setFormErrors] = useState({});
  const isEditMode = Boolean(account);

  // Определяем функцию, которая будет вызвана при отправке
  const mutationFn = async (data) => {
    if (isEditMode) {
      await apiService.updateAccount(account.id, data);
    } else {
      await apiService.createAccount({ ...data, workspace_id: activeWorkspace.id });
    }
  };

  // Используем наш хук для управления отправкой формы
  const [submitAccount, isSubmitting, submitError] = useApiMutation(mutationFn, {
      onSuccess: () => {
          fetchAccounts(activeWorkspace.id); // Обновляем список счетов в контексте
          if (onSuccess) onSuccess();
      }
  });

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
    // Убираем ошибку при изменении поля
    if (formErrors[name]) {
        setFormErrors(prev => ({ ...prev, [name]: null }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormErrors({});
    
    const validationErrors = validateForm(formData, isEditMode);
    if (Object.keys(validationErrors).length > 0) {
        setFormErrors(validationErrors);
        return;
    }

    const dataToSend = {
      name: formData.name,
      account_type: formData.account_type,
      currency: formData.currency,
      is_active: formData.is_active,
    };
    
    if (!isEditMode) {
      dataToSend.initial_balance = parseFloat(String(formData.initial_balance).replace(',', '.'));
    }

    await submitAccount(dataToSend);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {submitError && <Alert type="error">{submitError}</Alert>}
      
      <div>
        <Label htmlFor="name">Название счета</Label>
        <Input id="name" name="name" value={formData.name} onChange={handleChange} required placeholder="Например, Карта Сбербанка"/>
        {formErrors.name && <p className="text-red-500 text-xs mt-1">{formErrors.name}</p>}
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
          <Input type="number" id="initial_balance" name="initial_balance" value={formData.initial_balance} onChange={handleChange} step="0.01" required disabled={isEditMode} className={isEditMode ? 'bg-gray-100 cursor-not-allowed' : ''} />
           {formErrors.initial_balance && <p className="text-red-500 text-xs mt-1">{formErrors.initial_balance}</p>}
        </div>
      </div>
      {isEditMode && (
        <div className="flex items-center">
          <input id="is_active" name="is_active" type="checkbox" checked={formData.is_active} onChange={handleChange} className="h-4 w-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"/>
          <Label htmlFor="is_active" className="ml-2">Счет активен</Label>
        </div>
      )}
      <div className="flex justify-end pt-2">
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Сохранение...' : (isEditMode ? 'Сохранить изменения' : 'Создать счет')}
        </Button>
      </div>
    </form>
  );
}

export default AccountForm;