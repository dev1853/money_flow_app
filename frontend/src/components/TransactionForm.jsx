// /frontend/src/components/TransactionForm.jsx

import React, { useState, useEffect, useMemo } from 'react';
import { format, parseISO } from 'date-fns';
import { ru } from 'date-fns/locale';
import Alert from './Alert';
import Button from './Button';
import Select from './forms/Select';
import Input from './forms/Input';
import Label from './forms/Label';
import Textarea from './forms/Textarea';
import DatePicker from './forms/DatePicker';
import SegmentedControl from './forms/SegmentedControl';
import { ArrowUpCircleIcon, ArrowDownCircleIcon } from '@heroicons/react/24/solid';

const buildArticleOptions = (articles, parentId = null, level = 0) => {
    if (!articles) return [];
    let options = [];
    const children = articles.filter(a => a.parent_id === parentId);
    for (const article of children) {
        if (article.type !== 'group') {
            options.push({ ...article, label: `${'— '.repeat(level)}${article.name}` });
        }
        options = options.concat(buildArticleOptions(articles, article.id, article.type === 'group' ? level : level + 1));
    }
    return options;
};

const validateForm = (formData) => {
    const newErrors = {};
    if (!formData.date) newErrors.date = 'Дата обязательна.';
    if (!formData.account_id) newErrors.account_id = 'Счет обязателен.';
    if (!formData.amount || parseFloat(formData.amount) <= 0) {
        newErrors.amount = 'Сумма должна быть больше нуля.';
    }
    return newErrors;
};

function TransactionForm({ transaction, onSubmit, onCancel, accounts, ddsArticles, isSubmitting, error, defaultType = 'expense' }) {
    
    const getInitialState = () => {
        if (transaction) { // Режим редактирования
            const transactionType = transaction.transaction_type.toLowerCase();
            return {
                date: transaction.transaction_date ? parseISO(transaction.transaction_date) : new Date(),
                account_id: String(transaction.from_account_id || transaction.to_account_id || ''),
                amount: String(transaction.amount) || '',
                transaction_type: transactionType,
                dds_article_id: String(transaction.dds_article_id || ''),
                description: transaction.description.split(' (Контрагент:')[0].split(' (Сотрудник:')[0],
                contractor: transaction.description.match(/\(Контрагент: (.*?)\)/)?.[1] || '',
                employee: transaction.description.match(/\(Сотрудник: (.*?)\)/)?.[1] || '',
            };
        }
        // Режим создания
        return {
            date: new Date(), account_id: '', amount: '',
            transaction_type: defaultType, dds_article_id: '',
            description: '', contractor: '', employee: '',
        };
    };

    const [formData, setFormData] = useState(getInitialState);
    const [validationErrors, setValidationErrors] = useState({});

    useEffect(() => {
        setFormData(getInitialState());
    }, [transaction]);

    const articleOptions = useMemo(() => {
        if (!ddsArticles) return [];
        const filteredArticles = ddsArticles.filter(
            (article) => article.article_type === formData.transaction_type || article.article_type === 'group'
        );
        return buildArticleOptions(filteredArticles);
    }, [ddsArticles, formData.transaction_type]);
    
    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleDateChange = (date) => {
        setFormData(prev => ({ ...prev, date: date }));
    };
    
    const setTransactionType = (type) => {
        setFormData(prev => ({ ...prev, transaction_type: type, dds_article_id: '' }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        const formErrors = validateForm(formData);
        if (Object.keys(formErrors).length > 0) {
            setValidationErrors(formErrors);
            return;
        }

        let fullDescription = formData.description || '';
        if (formData.contractor) fullDescription += ` (Контрагент: ${formData.contractor})`;
        if (formData.employee) fullDescription += ` (Сотрудник: ${formData.employee})`;

        const payload = {
            transaction_date: format(formData.date, 'yyyy-MM-dd'),
            amount: parseFloat(formData.amount),
            description: fullDescription.trim(),
            transaction_type: formData.transaction_type.toUpperCase(),
            dds_article_id: formData.dds_article_id ? parseInt(formData.dds_article_id) : null,
            from_account_id: null,
            to_account_id: null,
        };
        
        if (formData.transaction_type === 'expense') {
            payload.from_account_id = parseInt(formData.account_id);
        } else if (formData.transaction_type === 'income') {
            payload.to_account_id = parseInt(formData.account_id);
        }
        
        console.log("TransactionForm: Отправка данных ->", payload);
        onSubmit(payload);
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            {error && <Alert type="error">{typeof error === 'string' ? error : JSON.stringify(error)}</Alert>}

            <SegmentedControl options={transactionTypeOptions} value={formData.transaction_type} onChange={setTransactionType}/>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <Label htmlFor="date">Дата</Label>
                    <DatePicker selected={formData.date} onChange={handleDateChange} dateFormat="dd.MM.yyyy" locale={ru} required />
                    {validationErrors.date && <p className="text-red-500 text-xs mt-1">{validationErrors.date}</p>}
                </div>
                <div>
                    <Label htmlFor="amount">Сумма</Label>
                    <Input type="number" id="amount" name="amount" value={formData.amount} onChange={handleChange} step="0.01" placeholder="0.00" required />
                    {validationErrors.amount && <p className="text-red-500 text-xs mt-1">{validationErrors.amount}</p>}
                </div>
            </div>

            <div>
                <Label htmlFor="account_id">Счет</Label>
                <Select id="account_id" name="account_id" value={formData.account_id || ''} onChange={handleChange} required>
                    <option value="" disabled>Выберите счет</option>
                    {(accounts || []).map(acc => (
                        <option key={acc.id} value={acc.id}>{acc.name} ({acc.currency})</option>
                    ))}
                </Select>
                {validationErrors.account_id && <p className="text-red-500 text-xs mt-1">{validationErrors.account_id}</p>}
            </div>

            <div>
                <Label htmlFor="dds_article_id">Статья {formData.transaction_type === 'income' ? 'доходов' : 'расходов'}</Label>
                <Select id="dds_article_id" name="dds_article_id" value={formData.dds_article_id || ''} onChange={handleChange}>
                    <option value="">Без статьи</option>
                    {articleOptions.map(article => (
                        <option key={article.id} value={article.id}>{article.label}</option>
                    ))}
                </Select>
            </div>

            <div>
                <Label htmlFor="contractor">Контрагент</Label>
                <Input type="text" id="contractor" name="contractor" value={formData.contractor} onChange={handleChange} placeholder="Например, ООО 'Ромашка'"/>
            </div>

            <div>
                <Label htmlFor="description">Описание</Label>
                <Textarea id="description" name="description" value={formData.description} onChange={handleChange} rows={3} placeholder="Назначение платежа..." />
            </div>

            <div className="flex justify-end pt-4 space-x-2">
                {onCancel && <Button type="button" onClick={onCancel} variant="secondary">Отмена</Button>}
                <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? 'Сохранение...' : 'Сохранить'}
                </Button>
            </div>
        </form>
    );
}

export default TransactionForm;