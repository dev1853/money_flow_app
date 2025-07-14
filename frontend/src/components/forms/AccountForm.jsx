import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { apiService } from '../../services/apiService';
import { useApiMutation } from '../../hooks/useApiMutation';

import Button from '../Button';
import Input from './Input';
import Label from './Label';
import Select from './Select';
import Alert from '../Alert';

const ACCOUNT_TYPES = [
  { value: 1, label: 'Банковский счет' },
  { value: 2, label: 'Касса' },
];

const PREDEFINED_CURRENCIES = [
    { code: 'RUB', name: 'Российский рубль' },
    { code: 'USD', name: 'Доллар США' },
    { code: 'EUR', name: 'Евро' },
];

const validateForm = (formData, isEditMode) => {
    const errors = {};
    if (!formData.name.trim()) {
        errors.name = 'Название счета обязательно для заполнения.';
    }
    if (!formData.account_type_id) {
        errors.account_type_id = 'Тип счета обязателен для заполнения.';
    }
    if (!isEditMode && (!formData.initial_balance || isNaN(parseFloat(formData.initial_balance)))) {
        errors.initial_balance = 'Начальный баланс должен быть числом.';
    }
    return errors;
}

function AccountForm({ account, onSuccess }) {
  const { activeWorkspace, fetchDataForWorkspace } = useAuth(); 
  const [formData, setFormData] = useState({
      name: account?.name || '',
      account_type_id: account?.account_type_id || ACCOUNT_TYPES[0].value, 
      initial_balance: account?.initial_balance || '0.00',
      currency: account?.currency || 'RUB',
      is_active: account ? account.is_active : true,
  });
  const [formErrors, setFormErrors] = useState({});
  const isEditMode = Boolean(account);

  const mutationFn = async (data) => {
    if (isEditMode) {
      await apiService.updateAccount(account.id, data);
    } else {
      await apiService.createAccount({ ...data, workspace_id: activeWorkspace.id });
    }
  };

  const [submitAccount, { isLoading: isSubmitting, error: submitError }] = useApiMutation(mutationFn, {
      onSuccess: () => {
          if (activeWorkspace?.id) { 
            fetchDataForWorkspace(activeWorkspace.id); 
          }
          if (onSuccess) onSuccess();
      }
  });

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    const newValue = name === 'account_type_id' ? parseInt(value, 10) : (type === 'checkbox' ? checked : value);
    setFormData(prev => ({ ...prev, [name]: newValue }));
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
      account_type_id: formData.account_type_id, 
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
        {/* 1. Adapt form error text */}
        {formErrors.name && <p className="text-red-500 dark:text-red-400 text-xs mt-1">{formErrors.name}</p>}
      </div>
      <div>
        <Label htmlFor="account_type_id">Тип счета</Label>
        <Select id="account_type_id" name="account_type_id" value={formData.account_type_id} onChange={handleChange} required>
          {ACCOUNT_TYPES.map(type => (
            <option key={type.value} value={type.value}>{type.label}</option>
          ))}
        </Select>
        {formErrors.account_type_id && <p className="text-red-500 dark:text-red-400 text-xs mt-1">{formErrors.account_type_id}</p>}
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
          <Input 
              type="number" 
              id="initial_balance" 
              name="initial_balance" 
              value={formData.initial_balance} 
              onChange={handleChange} 
              step="0.01" 
              required 
              disabled={isEditMode} 
              // 👇 ВОТ ФИНАЛЬНОЕ ИСПРАВЛЕНИЕ 👇
              // Мы явно переопределяем все нужные стили, включая базовые и для темной темы
              className={isEditMode 
                  ? 'bg-gray-100 dark:bg-gray-800/50 text-gray-500 dark:text-gray-400 border-gray-300 dark:border-gray-700 cursor-not-allowed' 
                  : ''
              } 
          />
          {formErrors.initial_balance && <p className="text-red-500 dark:text-red-400 text-xs mt-1">{formErrors.initial_balance}</p>}
      </div>
      </div>
      {isEditMode && (
        <div className="flex items-center">
          {/* 3. Adapt checkbox styles */}
          <input id="is_active" name="is_active" type="checkbox" checked={formData.is_active} onChange={handleChange} className="h-4 w-4 rounded border-gray-300 dark:border-gray-600 text-indigo-600 dark:bg-gray-700 focus:ring-indigo-500 dark:focus:ring-indigo-600 dark:ring-offset-gray-800"/>
          {/* Label component is already adapted */}
          <Label htmlFor="is_active" className="ml-2 mb-0">Счет активен</Label>
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