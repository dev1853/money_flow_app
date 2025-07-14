// frontend/src/components/forms/TransactionForm.jsx

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { apiService } from '../../services/apiService';
import Input from './Input';
import Select from './Select';
import DatePicker from './DatePicker';
import Button from '../Button';
import Alert from '../Alert';
import { TransactionType } from '../../utils/constants';
import { flattenDdsArticles } from '../../utils/articleUtils';
import { parseISO } from 'date-fns';

// --- 1. НОВЫЙ КОМПОНЕНТ: СТИЛЬНЫЕ РАДИО-КНОПКИ ДЛЯ ТИПА ТРАНЗАКЦИИ ---
const TransactionTypeRadio = ({ value, onChange }) => {
  const types = [
    { id: TransactionType.EXPENSE, label: 'Расход' },
    { id: TransactionType.INCOME, label: 'Доход' },
    { id: TransactionType.TRANSFER, label: 'Перевод' },
  ];

  return (
    <div>
      <div className="flex w-full items-center justify-between rounded-lg bg-gray-100 dark:bg-gray-800 p-1 border border-gray-200 dark:border-gray-700">
        {types.map((type) => (
          <label
            key={type.id}
            className={`flex-1 text-center text-sm font-semibold cursor-pointer p-2 rounded-md transition-colors duration-200 ${
              value === type.id
                ? 'bg-white dark:bg-indigo-600 text-indigo-600 dark:text-white shadow-sm'
                : 'text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700/50'
            }`}
          >
            <input
              type="radio"
              name="transaction_type"
              value={type.id}
              checked={value === type.id}
              onChange={onChange}
              className="sr-only" // Скрываем стандартную радио-кнопку
            />
            {type.label}
          </label>
        ))}
      </div>
    </div>
  );
};


function TransactionForm({ transaction: transactionToEdit, onSubmit, onCancel, isSubmitting, error: submissionError }) {
    const { accounts } = useAuth();
    
    // --- 2. УЛУЧШЕННОЕ НАЧАЛЬНОЕ СОСТОЯНИЕ ---
    const getInitialState = () => ({
        description: '',
        amount: '',
        // Дата по умолчанию - сегодня
        transaction_date: new Date(), 
        transaction_type: TransactionType.EXPENSE,
        from_account_id: accounts.length > 0 ? accounts[0].id : '',
        to_account_id: '',
        dds_article_id: '',
        // Контрагент и договор по умолчанию не выбраны
        counterparty_id: '',
        contract_id: ''
    });

    const [formData, setFormData] = useState(getInitialState());
    const [ddsArticles, setDdsArticles] = useState([]);
    const [counterparties, setCounterparties] = useState([]);
    const [contracts, setContracts] = useState([]);
    const [isLoadingContracts, setIsLoadingContracts] = useState(false);

    const isEditMode = Boolean(transactionToEdit);

    // Заполнение формы при редактировании
    useEffect(() => {
        if (isEditMode) {
            setFormData({
                description: transactionToEdit.description || '',
                amount: String(transactionToEdit.amount),
                transaction_date: transactionToEdit.transaction_date ? parseISO(transactionToEdit.transaction_date) : new Date(),
                transaction_type: transactionToEdit.transaction_type || TransactionType.EXPENSE,
                from_account_id: transactionToEdit.from_account_id || '',
                to_account_id: transactionToEdit.to_account_id || '',
                dds_article_id: transactionToEdit.dds_article_id || '',
                counterparty_id: transactionToEdit.counterparty_id || '',
                contract_id: transactionToEdit.contract_id || ''
            });
        } else {
            // Сбрасываем к начальному состоянию при переключении с редактирования на создание
            setFormData(getInitialState());
        }
    }, [transactionToEdit, accounts]);

    // Загрузка справочников
    useEffect(() => {
        apiService.getDdsArticles().then(setDdsArticles).catch(console.error);
        apiService.getCounterparties().then(data => setCounterparties(data?.items || [])).catch(console.error);
    }, []);

    // --- 3. ДИНАМИЧЕСКАЯ ФИЛЬТРАЦИЯ ДОГОВОРОВ ---
    useEffect(() => {
        if (formData.counterparty_id) {
            setIsLoadingContracts(true);
            apiService.getContracts({ counterparty_id: formData.counterparty_id })
                .then(data => setContracts(data?.items || []))
                .catch(console.error)
                .finally(() => setIsLoadingContracts(false));
        } else {
            // Если контрагент не выбран, сбрасываем список договоров
            setContracts([]);
            setFormData(prev => ({...prev, contract_id: ''})); // и выбор договора
        }
    }, [formData.counterparty_id]);


    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleDateChange = (date) => {
        setFormData(prev => ({ ...prev, transaction_date: date }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        const dataToSend = {
            ...formData,
            amount: parseFloat(formData.amount),
            transaction_date: formData.transaction_date.toISOString().split('T')[0], // Форматируем дату перед отправкой
            from_account_id: formData.from_account_id || null,
            to_account_id: formData.to_account_id || null,
            dds_article_id: formData.dds_article_id || null,
            counterparty_id: formData.counterparty_id || null,
            contract_id: formData.contract_id || null,
        };
        onSubmit(dataToSend);
    };

    // ... (опции для селектов) ...
    const accountOptions = (accounts || []).map(acc => ({ value: acc.id, label: acc.name }));
    const ddsArticleOptions = useMemo(() => flattenDdsArticles(ddsArticles || []), [ddsArticles]);
    const counterpartyOptions = counterparties.map(cp => ({ value: cp.id, label: cp.name }));
    const contractOptions = contracts.map(c => ({ value: c.id, label: c.name }));

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            {submissionError && <Alert type="error">{submissionError.message}</Alert>}

            {/* --- 4. ИСПОЛЬЗУЕМ НОВЫЕ РАДИО-КНОПКИ --- */}
            <TransactionTypeRadio value={formData.transaction_type} onChange={handleChange} />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input label="Сумма" name="amount" type="number" value={formData.amount} onChange={handleChange} required step="0.01" />
                <DatePicker label="Дата транзакции" selected={formData.transaction_date} onChange={handleDateChange} required />
            </div>

            <Input label="Описание" name="description" value={formData.description} onChange={handleChange} placeholder="Назначение платежа..."/>

            {/* Условный рендеринг полей в зависимости от типа */}
            {formData.transaction_type === TransactionType.TRANSFER ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Select label="Со счета" name="from_account_id" value={formData.from_account_id} onChange={handleChange} options={accountOptions} required placeholder="Выберите счет" />
                    <Select label="На счет" name="to_account_id" value={formData.to_account_id} onChange={handleChange} options={accountOptions} required placeholder="Выберите счет" />
                </div>
            ) : (
                <>
                    <Select label={formData.transaction_type === 'INCOME' ? "На счет" : "Со счета"} name={formData.transaction_type === 'INCOME' ? "to_account_id" : "from_account_id"} value={formData.transaction_type === 'INCOME' ? formData.to_account_id : formData.from_account_id} onChange={handleChange} options={accountOptions} required placeholder="Выберите счет" />
                    <Select label="Статья ДДС" name="dds_article_id" value={formData.dds_article_id} onChange={handleChange} required>
                        <option value="">Выберите статью</option>
                        {ddsArticleOptions.map(opt => <option key={opt.id} value={opt.id}>{opt.name}</option>)}
                    </Select>
                </>
            )}

            {/* Блок Контрагента и Договора (только для Дохода/Расхода) */}
            {formData.transaction_type !== TransactionType.TRANSFER && (
                <div className="p-4 space-y-4 border rounded-lg bg-gray-50 dark:bg-gray-800/50 dark:border-gray-700">
                    <Select label="Контрагент (опционально)" name="counterparty_id" value={formData.counterparty_id} onChange={handleChange}>
                        <option value="">Не выбрано</option>
                        {counterpartyOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                    </Select>
                    <Select label="Договор (опционально)" name="contract_id" value={formData.contract_id} onChange={handleChange} disabled={!formData.counterparty_id || isLoadingContracts}>
                        <option value="">{isLoadingContracts ? 'Загрузка...' : 'Не выбрано'}</option>
                        {contractOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                    </Select>
                </div>
            )}
            
            <div className="flex justify-end pt-4 gap-3">
                <Button type="button" variant="secondary" onClick={onCancel}>Отмена</Button>
                <Button type="submit" disabled={isSubmitting}>{isSubmitting ? 'Сохранение...' : (isEditMode ? 'Сохранить' : 'Создать')}</Button>
            </div>
        </form>
    );
}

export default TransactionForm;