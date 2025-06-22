// frontend/src/components/TransactionForm.jsx
import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { apiService } from '../services/apiService';
import { format, parseISO } from 'date-fns';

// Импорт компонентов
import Alert from './Alert';
import Button from './Button'; 
import Select from './forms/Select';
import Input from './forms/Input';
import Label from './forms/Label';
import Textarea from './forms/Textarea';
import DatePicker from './forms/DatePicker';
import { ru } from 'date-fns/locale';

// Вспомогательная функция для построения иерархического списка для <select>
const buildArticleOptions = (articles, parentId = null, level = 0) => {
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

// Функция для установки начального состояния формы
const getInitialFormData = (transaction, defaultType, defaultAccountId = '') => {
    console.log("DEBUG(TransactionForm): getInitialFormData called.");
    return {
        date: transaction ? parseISO(transaction.date) : new Date(),
        account_id: transaction?.account_id || defaultAccountId,
        amount: transaction?.amount?.toFixed(2) || '',
        transaction_type: transaction?.transaction_type || defaultType,
        dds_article_id: transaction?.dds_article_id || '',
        description: transaction?.description || '',
        payee: ''
    };
};

function TransactionForm({ transaction, onSubmit, onCancel, loading, isQuickCashExpense = false }) {
    console.log("DEBUG(TransactionForm): Component Rendered. Props:", { transaction, onSubmit, onCancel, loading, isQuickCashExpense }); // <--- ЛОГ РЕНДЕРА
    const { activeWorkspace } = useAuth();
    const [formData, setFormData] = useState(() => getInitialFormData(transaction, 'expense', ''));
    const [accounts, setAccounts] = useState([]);
    const [ddsArticles, setDdsArticles] = useState([]);
    const [error, setError] = useState('');

    useEffect(() => {
        console.log("DEBUG(TransactionForm): useEffect mounted/updated. activeWorkspace:", activeWorkspace); // <--- ЛОГ useEffect
        const fetchDependencies = async () => {
            setError('');
            try {
                if (!activeWorkspace) {
                    console.log("DEBUG(TransactionForm): activeWorkspace is null, cannot fetch dependencies.");
                    setError("Рабочее пространство не активно.");
                    return;
                }

                console.log("DEBUG(TransactionForm): Fetching accounts for workspace:", activeWorkspace.id);
                const fetchedAccounts = await apiService.get(`/accounts/?workspace_id=${activeWorkspace.id}`);
                setAccounts(fetchedAccounts);
                console.log("DEBUG(TransactionForm): Fetched accounts:", fetchedAccounts);

                console.log("DEBUG(TransactionForm): Fetching DDS articles for workspace:", activeWorkspace.id);
                const fetchedDdsArticles = await apiService.get(`/dds-articles/?workspace_id=${activeWorkspace.id}`);
                setDdsArticles(fetchedDdsArticles);
                console.log("DEBUG(TransactionForm): Fetched DDS articles:", fetchedDdsArticles);

                if (isQuickCashExpense && fetchedAccounts.length > 0) {
                    const cashAccount = fetchedAccounts.find(acc => acc.account_type === 'cash');
                    const defaultAccountId = cashAccount ? cashAccount.id : (fetchedAccounts[0] ? fetchedAccounts[0].id : '');
                    console.log("DEBUG(TransactionForm): QuickExpense mode. Setting default cash account:", defaultAccountId);
                    setFormData(prev => ({
                        ...prev,
                        account_id: defaultAccountId,
                        transaction_type: 'expense',
                        date: new Date(),
                    }));
                }
            } catch (err) {
                setError(err.message || "Ошибка загрузки данных для формы.");
                console.error("DEBUG(TransactionForm): Ошибка загрузки зависимостей формы:", err);
            }
        };

        fetchDependencies();
        // Cleanup function (optional, but good practice for useEffect)
        return () => console.log("DEBUG(TransactionForm): useEffect cleanup.");
    }, [activeWorkspace, isQuickCashExpense]);

    const accountOptions = useMemo(() => {
        console.log("DEBUG(TransactionForm): accountOptions useMemo re-calculated.");
        return accounts.map(acc => ({ value: acc.id, label: `${acc.name} (${acc.currency})` }));
    }, [accounts]);

    const articleOptions = useMemo(() => {
        console.log("DEBUG(TransactionForm): articleOptions useMemo re-calculated.");
        return buildArticleOptions(ddsArticles);
    }, [ddsArticles]);

    const typeInfo = useMemo(() => {
        console.log("DEBUG(TransactionForm): typeInfo useMemo re-calculated. transaction_type:", formData.transaction_type);
        switch (formData.transaction_type) {
            case 'income':
                return { label: 'Доход', styles: 'bg-green-100 text-green-800' };
            case 'expense':
                return { label: 'Расход', styles: 'bg-red-100 text-red-800' };
            default:
                return { label: 'Тип', styles: 'bg-gray-100 text-gray-800' };
        }
    }, [formData.transaction_type]);

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        console.log(`DEBUG(TransactionForm): handleChange called. Field: ${name}, Value: ${value}, Type: ${type}`); // <--- ЛОГ
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
        console.log("DEBUG(TransactionForm): formData after handleChange:", { ...formData, [name]: type === 'checkbox' ? checked : value }); // Лог нового состояния
    };

    const handleDateChange = (date) => {
        console.log("DEBUG(TransactionForm): handleDateChange called. Date:", date); // <--- ЛОГ
        setFormData(prev => ({
            ...prev,
            date: date
        }));
        console.log("DEBUG(TransactionForm): formData after handleDateChange:", { ...formData, date: date }); // Лог нового состояния
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        console.log("DEBUG(TransactionForm): handleSubmit invoked!");
        console.log("DEBUG(TransactionForm): Current formData BEFORE validation:", JSON.stringify(formData)); 
        setError('');

        if (!formData.account_id || !formData.amount || !formData.transaction_type || !formData.date) {
            setError("Пожалуйста, заполните все обязательные поля: Счет, Сумма, Тип, Дата.");
            console.log("DEBUG(TransactionForm): Validation FAILED."); 
            return;
        }
        console.log("DEBUG(TransactionForm): Validation PASSED. Preparing dataToSubmit."); 
        
        console.log("DEBUG(TransactionForm): formData.date before formatting:", formData.date, "Type:", typeof formData.date); // <--- НОВЫЙ ЛОГ
        const formattedDate = format(formData.date, 'yyyy-MM-dd'); // Форматируем дату
        console.log("DEBUG(TransactionForm): Formatted date string:", formattedDate); // <--- НОВЫЙ ЛОГ

        const dataToSubmit = {
            date: formattedDate, // Используем отформатированную дату
            amount: parseFloat(formData.amount),
            account_id: parseInt(formData.account_id),
            transaction_type: formData.transaction_type,
            description: formData.payee ? `Кому: ${formData.payee}. ${formData.description}`.trim() : formData.description.trim(),
            
            dds_article_id: formData.dds_article_id ? parseInt(formData.dds_article_id) : null, 
            
            owner_id: activeWorkspace.owner_id, 
            workspace_id: activeWorkspace.id,
        };
        
        console.log("DEBUG(TransactionForm): Calling onSubmit with dataToSubmit:", JSON.stringify(dataToSubmit)); 
        console.log("DEBUG(TransactionForm): Type of onSubmit prop:", typeof onSubmit); 
        onSubmit(dataToSubmit); 
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            {console.log("DEBUG(TransactionForm): Form JSX rendered.")} {/* Лог рендера JSX */}
            {error && <Alert type="error">{error}</Alert>}

            <div>
                <Label htmlFor="date">Дата</Label>
                <DatePicker selected={formData.date} onChange={handleDateChange} dateFormat="dd.MM.yyyy" locale={ru} required />
            </div>

            <div>
                <Label htmlFor="account_id">Счет</Label>
                <Select
                    id="account_id"
                    name="account_id"
                    value={formData.account_id || ''}
                    onChange={handleChange}
                    required
                    disabled={isQuickCashExpense}
                    className={isQuickCashExpense ? 'bg-gray-100' : ''}
                >
                    <option value="">Выберите счет</option>
                    {accountOptions.map(option => (
                        <option key={option.value} value={option.value}>{option.label}</option>
                    ))}
                </Select>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
                <div>
                    <Label htmlFor="amount">Сумма</Label>
                    <Input type="number" id="amount" name="amount" value={formData.amount} onChange={handleChange} step="0.01" placeholder="0.00" required />
                </div>
                <div className={`p-2 rounded-md text-center font-medium ${typeInfo.styles}`}>
                    {typeInfo.label}
                    {!isQuickCashExpense && (
                        <Select
                            id="transaction_type"
                            name="transaction_type"
                            value={formData.transaction_type}
                            onChange={handleChange}
                            required
                            className="mt-1 block w-full"
                        >
                            <option value="income">Доход</option>
                            <option value="expense">Расход</option>
                        </Select>
                    )}
                </div>
            </div>
            
            {isQuickCashExpense && (
                <div>
                    <Label htmlFor="payee">Кому (получатель платежа)</Label>
                    <Input type="text" id="payee" name="payee" value={formData.payee} onChange={handleChange} placeholder="Например, Магазин 'Пятерочка'" />
                </div>
            )}

            <div>
                <Label htmlFor="dds_article_id">Статья ДДС</Label>
                <Select id="dds_article_id" name="dds_article_id" value={formData.dds_article_id || ''} onChange={handleChange}>
                    <option value="">Без статьи</option>
                    {articleOptions.map(article => (
                        <option key={article.id} value={article.id}>{article.label}</option>
                    ))}
                </Select>
            </div>

            <div>
                <Label htmlFor="description">Описание (Назначение платежа)</Label>
                <Textarea id="description" name="description" value={formData.description} onChange={handleChange} rows={3} placeholder="Описание расхода..." />
            </div>

            <div className="flex justify-end pt-4">
                {onCancel && (
                    <Button type="button" onClick={onCancel} variant="secondary" className="mr-2">Отмена</Button>
                )}
                <Button type="submit" disabled={loading}>{loading ? 'Сохранение...' : 'Сохранить'}</Button>
            </div>
        </form>
    );
}

export default TransactionForm;