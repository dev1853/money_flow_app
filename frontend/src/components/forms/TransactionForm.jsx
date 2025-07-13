// frontend/src/components/forms/TransactionForm.jsx

import React, { useState, useEffect, useMemo } from 'react'; 
import { useAuth } from '../../contexts/AuthContext'; 
import { apiService } from '../../services/apiService'; 
import Input from './Input'; 
import Select from './Select'; 
import DatePicker from './DatePicker'; 
import Button from '../Button'; 
import Alert from '../Alert'; 
import Loader from '../Loader'; 
import { TransactionType } from '../../utils/constants'; 
import { PlusIcon } from '@heroicons/react/24/solid'; 
import { flattenDdsArticles } from '../../utils/articleUtils'; 
import { parseISO } from 'date-fns'; // ИСПРАВЛЕНО: Добавлен импорт parseISO

function TransactionForm({ transaction: transactionToEdit, onSubmit, onCancel, isSubmitting, error: submissionError }) {
    const { accounts, activeWorkspace, fetchDataForWorkspace } = useAuth();
    
    const initialAccountId = accounts.length > 0 ? accounts[0].id : '';

    const [formData, setFormData] = useState({
        description: '',
        amount: '',
        transaction_date: new Date().toISOString().split('T')[0],
        transaction_type: TransactionType.EXPENSE,
        from_account_id: initialAccountId, 
        to_account_id: '', 
        dds_article_id: '',
        counterparty_id: '',
        contract_id: ''
    });

    const [ddsArticles, setDdsArticles] = useState([]); 
    const [counterparties, setCounterparties] = useState([]);
    const [contracts, setContracts] = useState([]);

    const accountOptions = accounts.map(acc => ({
        value: acc.id,
        label: `${acc.name} (${acc.balance} ${acc.currency || 'RUB'})`
    }));

    const ddsArticleOptions = useMemo(() => {
        const flattened = flattenDdsArticles(ddsArticles || []); 
        return flattened.map(article => ({
            value: article.id,
            label: article.name
        }));
    }, [ddsArticles]); 

    const counterpartyOptions = counterparties.map(cp => ({
        value: cp.id,
        label: cp.name
    }));

    const contractOptions = contracts.map(contract => ({
        value: contract.id,
        label: contract.name
    }));

    const transactionTypeOptions = Object.values(TransactionType).map(type => ({
        value: type,
        label: {
            [TransactionType.INCOME]: "Доход",
            [TransactionType.EXPENSE]: "Расход",
            [TransactionType.TRANSFER]: "Перевод",
        }[type]
    }));

    useEffect(() => {
        console.log("TransactionForm: useEffect запущен. transactionToEdit:", transactionToEdit); 
        if (transactionToEdit) {
            console.log("TransactionForm: transactionToEdit.transaction_date (из пропса):", transactionToEdit.transaction_date); 
            const dateValue = transactionToEdit.transaction_date || '';
            console.log("TransactionForm: dateValue (после || ''):", dateValue); 
            
            setFormData({
                description: transactionToEdit.description || '',
                amount: String(transactionToEdit.amount),
                transaction_date: dateValue,
                transaction_type: transactionToEdit.transaction_type || TransactionType.EXPENSE,
                from_account_id: transactionToEdit.from_account_id || '',
                to_account_id: transactionToEdit.to_account_id || '',
                dds_article_id: transactionToEdit.dds_article_id || '',
                counterparty_id: transactionToEdit.counterparty_id || '',
                contract_id: transactionToEdit.contract_id || ''
            });
            console.log("TransactionForm: formData.transaction_date (после setFormData):", dateValue); 
        } else {
            setFormData(prev => ({
                ...prev,
                description: '',
                amount: '',
                transaction_date: new Date().toISOString().split('T')[0],
                transaction_type: TransactionType.EXPENSE,
                from_account_id: accounts.length > 0 ? accounts[0].id : '', 
                to_account_id: '',
                dds_article_id: '',
                counterparty_id: '',
                contract_id: ''
            }));
        }
    }, [transactionToEdit, accounts]); 

    useEffect(() => {
        const fetchDdsArticlesAndEntities = async () => {
            if (activeWorkspace?.id) {
                try {
                    const articles = await apiService.getDdsArticles(activeWorkspace.id); 
                    setDdsArticles(articles); 

                    if (typeof apiService.getCounterparties !== 'function') {
                        throw new Error("apiService.getCounterparties не определена.");
                    }
                    const fetchedCounterparties = await apiService.getCounterparties({
                        workspace_id: activeWorkspace.id
                    });
                    setCounterparties(fetchedCounterparties?.items || []); 

                    if (typeof apiService.getContracts !== 'function') {
                        throw new Error("apiService.getContracts не определена.");
                    }
                    const fetchedContracts = await apiService.getContracts({
                        workspace_id: activeWorkspace.id
                    });
                    setContracts(fetchedContracts?.items || []); 

                } catch (err) {
                    console.error('Ошибка при загрузке данных для формы транзакции:', err);
                }
            }
        };
        fetchDdsArticlesAndEntities();
    }, [activeWorkspace]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleDateChange = (date) => {
        setFormData(prev => ({ ...prev, transaction_date: date ? date.toISOString().split('T')[0] : null }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        try {
            const dataToSend = {
                ...formData,
                amount: parseFloat(formData.amount),
                from_account_id: formData.from_account_id === '' ? null : parseInt(formData.from_account_id),
                to_account_id: formData.to_account_id === '' ? null : parseInt(formData.to_account_id),
                dds_article_id: formData.dds_article_id === '' ? null : parseInt(formData.dds_article_id),
                counterparty_id: formData.counterparty_id === '' ? null : parseInt(formData.counterparty_id),
                contract_id: formData.contract_id === '' ? null : parseInt(formData.contract_id)
            };

            if (dataToSend.transaction_type === TransactionType.TRANSFER) {
                if (!dataToSend.from_account_id || !dataToSend.to_account_id) {
                    throw new Error("Для перевода необходимо указать счета 'С' и 'На'.");
                }
                dataToSend.dds_article_id = null;
                dataToSend.counterparty_id = null;
                dataToSend.contract_id = null;
            } else {
                if (!dataToSend.dds_article_id) {
                    throw new Error("Для дохода/расхода необходимо указать статью ДДС.");
                }
                if (dataToSend.transaction_type === TransactionType.INCOME && !dataToSend.to_account_id) {
                    throw new Error("Для дохода необходимо указать счет, на который поступают средства.");
                }
                if (dataToSend.transaction_type === TransactionType.EXPENSE && !dataToSend.from_account_id) {
                    throw new Error("Для расхода необходимо указать счет, с которого списываются средства.");
                }
                dataToSend.to_account_id = dataToSend.transaction_type === TransactionType.INCOME ? dataToSend.to_account_id : null;
                dataToSend.from_account_id = dataToSend.transaction_type === TransactionType.EXPENSE ? dataToSend.from_account_id : null;
            }

            await onSubmit(dataToSend);
            
        } catch (err) {
            throw err; 
        } finally {
        }
    };

    if (isSubmitting) { 
        return <Loader text="Сохранение..." />;
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            {submissionError && <Alert type="error">{submissionError.message || 'Произошла ошибка при сохранении.'}</Alert>} 
            <Input
                label="Описание"
                name="description"
                value={formData.description}
                onChange={handleChange}
            />
            <Input
                label="Сумма"
                name="amount"
                type="number"
                value={formData.amount}
                onChange={handleChange}
                required
                min="0.01"
                step="0.01"
            />
            <DatePicker
                label="Дата транзакции"
                selectedDate={formData.transaction_date ? parseISO(formData.transaction_date) : null} // ИСПРАВЛЕНО: Используем parseISO
                onChange={handleDateChange}
                required
            />
            <Select
                label="Тип транзакции"
                name="transaction_type"
                value={formData.transaction_type}
                onChange={handleChange}
                options={transactionTypeOptions}
                required
            />
            
            {/* Поля для перевода */}
            {formData.transaction_type === TransactionType.TRANSFER && (
                <div className="grid grid-cols-2 gap-4">
                    <Select
                        label="Со счета"
                        name="from_account_id"
                        value={formData.from_account_id}
                        onChange={handleChange}
                        options={accountOptions}
                        required={formData.transaction_type === TransactionType.TRANSFER}
                        placeholder="Выберите счет"
                    />
                    <Select
                        label="На счет"
                        name="to_account_id"
                        value={formData.to_account_id}
                        onChange={handleChange}
                        options={accountOptions}
                        required={formData.transaction_type === TransactionType.TRANSFER}
                        placeholder="Выберите счет"
                    />
                </div>
            )}

            {/* Поля для дохода/расхода */}
            {formData.transaction_type !== TransactionType.TRANSFER && (
                <>
                    <Select
                        label={formData.transaction_type === TransactionType.INCOME ? "На счет" : "Со счета"}
                        name={formData.transaction_type === TransactionType.INCOME ? "to_account_id" : "from_account_id"}
                        value={formData.transaction_type === TransactionType.INCOME ? formData.to_account_id : formData.from_account_id}
                        onChange={handleChange}
                        options={accountOptions}
                        required
                        placeholder="Выберите счет"
                    />
                    <Select
                        label="Статья ДДС"
                        name="dds_article_id"
                        value={formData.dds_article_id}
                        onChange={handleChange}
                        options={ddsArticleOptions} 
                        required
                        placeholder="Выберите статью ДДС"
                    />
                    {/* НОВОЕ: Поле для контрагента */}
                    <Select
                        label="Контрагент (опционально)"
                        name="counterparty_id"
                        value={formData.counterparty_id}
                        onChange={handleChange}
                        options={counterpartyOptions}
                        placeholder="Выберите контрагента"
                        disabled={counterparties.length === 0} 
                    />
                    {/* НОВОЕ: Поле для договора */}
                    <Select
                        label="Договор (опционально)"
                        name="contract_id"
                        value={formData.contract_id}
                        onChange={handleChange}
                        options={contractOptions}
                        placeholder="Выберите договор"
                        disabled={contracts.length === 0} 
                    />
                </>
            )}
            
            <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting ? <Loader text="Сохранение..." /> : (transactionToEdit ? 'Сохранить изменения' : 'Создать транзакцию')}
            </Button>
        </form>
    );
}

export default TransactionForm;