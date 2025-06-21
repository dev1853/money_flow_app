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
import DatePicker from './forms/DatePicker'; // Наш кастомный DatePicker
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
const getInitialFormData = (transaction, defaultType) => ({
    date: transaction ? parseISO(transaction.date) : new Date(),
    account_id: transaction?.account_id || '',
    amount: transaction?.amount?.toFixed(2) || '',
    transaction_type: transaction?.transaction_type || defaultType,
    description: transaction?.description || '',
    dds_article_id: transaction?.dds_article_id || '',
});

function TransactionForm({ transaction, defaultType = 'expense', onSuccess }) {
    const { activeWorkspace, accounts, fetchAccounts } = useAuth();
    
    const [formData, setFormData] = useState(getInitialFormData(transaction, defaultType));
    const [ddsArticles, setDdsArticles] = useState([]);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const isEditMode = Boolean(transaction);

    // Загрузка справочника статей ДДС
    useEffect(() => {
        if (activeWorkspace) {
            apiService.get(`/dds-articles/?workspace_id=${activeWorkspace.id}`)
                .then(data => setDdsArticles(data || []))
                .catch(err => console.error("Failed to fetch DDS articles", err));
        }
    }, [activeWorkspace]);

    // Обновление формы, только если меняется пропс transaction
    useEffect(() => {
        setFormData(getInitialFormData(transaction, defaultType));
    }, [transaction, defaultType]);
    
    const articleOptions = useMemo(() => buildArticleOptions(ddsArticles), [ddsArticles]);

    // Умный обработчик изменений, который сам обновляет тип транзакции
    const handleChange = (e) => {
        const { name, value } = e.target;
        const newState = { ...formData, [name]: value };

        if (name === 'dds_article_id') {
            const selectedArticle = ddsArticles.find(a => a.id === parseInt(value));
            if (selectedArticle && selectedArticle.type !== 'group') {
                newState.transaction_type = selectedArticle.type;
            }
        }
        setFormData(newState);
    };

    const handleDateChange = (date) => {
        setFormData(prev => ({ ...prev, date: date }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.account_id) {
            setError("Пожалуйста, выберите счет.");
            return;
        }
        setLoading(true);
        setError('');
        
        try {
            const dataToSend = {
                ...formData,
                date: format(formData.date, 'yyyy-MM-dd'),
                account_id: parseInt(formData.account_id, 10),
                amount: Math.abs(parseFloat(String(formData.amount).replace(',', '.'))),
                transaction_type: formData.transaction_type,
                description: formData.description,
                dds_article_id: formData.dds_article_id ? parseInt(formData.dds_article_id, 10) : null,
            };

            if (isEditMode) {
                // --- ИСПРАВЛЕНИЕ: Отправляем все измененные данные ---
                await apiService.put(`/transactions/${transaction.id}`, dataToSend);
            } else {
                await apiService.post('/transactions/', dataToSend);
            }
            
            await fetchAccounts();
            if (onSuccess) onSuccess();

        } catch (err) {
            setError(err.message || 'Произошла ошибка при сохранении транзакции');
        } finally {
            setLoading(false);
        }
    };
    
    // Определяем информацию о типе для отображения бейджа
    const typeInfo = formData.transaction_type === 'income' 
        ? { label: 'Доход', styles: 'bg-green-100 text-green-800' }
        : { label: 'Расход', styles: 'bg-red-100 text-red-800' };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            {error && <Alert type="error">{error}</Alert>}
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                 <DatePicker label="Дата" selected={formData.date} onChange={handleDateChange} />
                <div>
                    <Label htmlFor="account_id">Счет</Label>
                    <Select id="account_id" name="account_id" value={formData.account_id} onChange={handleChange} required>
                        <option value="" disabled>Выберите счет</option>
                        {accounts.filter(a => a.is_active).map(acc => <option key={acc.id} value={acc.id}>{acc.name} ({acc.currency})</option>)}
                    </Select>
                </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
                <div>
                    <Label htmlFor="amount">Сумма</Label>
                    <Input type="number" id="amount" name="amount" value={formData.amount} onChange={handleChange} step="0.01" placeholder="0.00" required />
                </div>
                <div className={`p-2 rounded-md text-center font-medium ${typeInfo.styles}`}>
                    {typeInfo.label}
                </div>
            </div>

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
                <Label htmlFor="description">Описание</Label>
                <Textarea id="description" name="description" value={formData.description} onChange={handleChange} rows={3} placeholder="Назначение платежа..." />
            </div>

            <div className="flex justify-end pt-4">
                <Button type="submit" disabled={loading}>{loading ? 'Сохранение...' : 'Сохранить'}</Button>
            </div>
        </form>
    );
}

export default TransactionForm;