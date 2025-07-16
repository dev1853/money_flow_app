// frontend/src/components/forms/TransactionForm.jsx

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { apiService } from '../../services/apiService';
import { useDataFetching } from '../../hooks/useDataFetching'; // Импортируем наш хук

// Компоненты
import Input from './Input';
import Select from './Select';
import DatePicker from './DatePicker';
import Button from '../Button';
import Alert from '../Alert';
import { TransactionType } from '../../utils/constants';
import { flattenDdsArticles } from '../../utils/articleUtils';
import { parseISO } from 'date-fns';

const TransactionTypeRadio = ({ value, onChange }) => {
    // ... этот компонент остается без изменений
};


// --- 1. ПРИНИМАЕМ workspaceId КАК ПРОП ---
function TransactionForm({ transaction: transactionToEdit, onSubmit, onCancel, isSubmitting, error: submissionError, workspaceId }) {
    const { accounts } = useAuth();
    
    const getInitialState = useCallback(() => ({
        description: '',
        amount: '',
        transaction_date: new Date(), 
        transaction_type: TransactionType.EXPENSE,
        from_account_id: accounts.length > 0 ? accounts[0].id : '',
        to_account_id: '',
        dds_article_id: '',
        counterparty_id: '',
        contract_id: ''
    }), [accounts]);

    const [formData, setFormData] = useState(getInitialState());
    
    // --- 2. ИСПОЛЬЗУЕМ useDataFetching ДЛЯ ЗАГРУЗКИ СПРАВОЧНИКОВ ---
    
    // Загрузка статей ДДС
    const fetchDdsArticles = useCallback(async () => {
        if (!workspaceId) return null;
        return apiService.getDdsArticles({ workspace_id: workspaceId });
    }, [workspaceId]);

    const { data: ddsArticles, loading: ddsArticlesLoading } = useDataFetching(fetchDdsArticles, [workspaceId], { skip: !workspaceId });

    // Загрузка контрагентов
    const fetchCounterparties = useCallback(async () => {
        if (!workspaceId) return null;
        // Загружаем всех контрагентов для выпадающего списка
        return apiService.getCounterparties({ workspace_id: workspaceId, limit: 1000 });
    }, [workspaceId]);

    const { data: counterpartiesData, loading: counterpartiesLoading } = useDataFetching(fetchCounterparties, [workspaceId], { skip: !workspaceId });
    const counterparties = counterpartiesData?.items || [];

    // Загрузка договоров (зависит от выбранного контрагента)
    const fetchContracts = useCallback(async () => {
        if (!formData.counterparty_id) return null;
        return apiService.getContracts({ counterparty_id: formData.counterparty_id, limit: 1000 });
    }, [formData.counterparty_id]);

    const { data: contractsData, loading: contractsLoading } = useDataFetching(fetchContracts, [formData.counterparty_id], { skip: !formData.counterparty_id });
    const contracts = contractsData?.items || [];


    const isEditMode = Boolean(transactionToEdit);

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
            setFormData(getInitialState());
        }
    }, [transactionToEdit, getInitialState]);


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
            transaction_date: formData.transaction_date.toISOString().split('T')[0],
            // Отправляем null, если значение пустое
            from_account_id: formData.from_account_id || null,
            to_account_id: formData.to_account_id || null,
            dds_article_id: formData.dds_article_id || null,
            counterparty_id: formData.counterparty_id || null,
            contract_id: formData.contract_id || null,
        };
        onSubmit(dataToSend);
    };

    const accountOptions = (accounts || []).map(acc => ({ value: acc.id, label: acc.name }));
    const ddsArticleOptions = useMemo(() => flattenDdsArticles(ddsArticles || []), [ddsArticles]);
    const counterpartyOptions = counterparties.map(cp => ({ value: cp.id, label: cp.name }));
    const contractOptions = contracts.map(c => ({ value: c.id, label: c.name }));

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            {submissionError && <Alert type="error">{submissionError.message}</Alert>}
            
            <TransactionTypeRadio value={formData.transaction_type} onChange={handleChange} />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input label="Сумма" name="amount" type="number" value={formData.amount} onChange={handleChange} required step="0.01" />
                <DatePicker label="Дата транзакции" selected={formData.transaction_date} onChange={handleDateChange} required />
            </div>

            <Input label="Описание" name="description" value={formData.description} onChange={handleChange} placeholder="Назначение платежа..."/>

            {formData.transaction_type === TransactionType.TRANSFER ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Select label="Со счета" name="from_account_id" value={formData.from_account_id} onChange={handleChange} options={accountOptions} required placeholder="Выберите счет" />
                    <Select label="На счет" name="to_account_id" value={formData.to_account_id} onChange={handleChange} options={accountOptions} required placeholder="Выберите счет" />
                </div>
            ) : (
                <>
                    <Select label={formData.transaction_type === 'INCOME' ? "На счет" : "Со счета"} name={formData.transaction_type === 'INCOME' ? "to_account_id" : "from_account_id"} value={formData.transaction_type === 'INCOME' ? formData.to_account_id : formData.from_account_id} onChange={handleChange} options={accountOptions} required placeholder="Выберите счет" />
                    <Select label="Статья ДДС" name="dds_article_id" value={formData.dds_article_id} onChange={handleChange} disabled={ddsArticlesLoading} required>
                        <option value="">{ddsArticlesLoading ? 'Загрузка...' : 'Выберите статью'}</option>
                        {ddsArticleOptions.map(opt => <option key={opt.id} value={opt.id}>{opt.name}</option>)}
                    </Select>
                </>
            )}

            {formData.transaction_type !== TransactionType.TRANSFER && (
                <div className="p-4 space-y-4 border rounded-lg bg-gray-50 dark:bg-gray-800/50 dark:border-gray-700">
                    <Select label="Контрагент (опционально)" name="counterparty_id" value={formData.counterparty_id} onChange={handleChange} disabled={counterpartiesLoading}>
                        <option value="">{counterpartiesLoading ? 'Загрузка...' : 'Не выбрано'}</option>
                        {counterpartyOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                    </Select>
                    <Select label="Договор (опционально)" name="contract_id" value={formData.contract_id} onChange={handleChange} disabled={!formData.counterparty_id || contractsLoading}>
                        <option value="">{contractsLoading ? 'Загрузка...' : 'Не выбрано'}</option>
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