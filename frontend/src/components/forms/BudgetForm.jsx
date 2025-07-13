// frontend/src/components/forms/BudgetForm.jsx

import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { apiService } from '../../services/apiService';
import { useApiMutation } from '../../hooks/useApiMutation';
import { useDataFetching } from '../../hooks/useDataFetching';

import Button from '../Button';
import Input from './Input';
import Label from './Label';
import Select from './Select';
import Alert from '../Alert';
import { PlusIcon, MinusCircleIcon } from '@heroicons/react/24/solid';

// Функция валидации остается без изменений
const validateForm = (formData) => {
    const errors = {};
    if (!formData.name.trim()) errors.name = 'Название бюджета обязательно.';
    if (!formData.start_date) errors.start_date = 'Дата начала обязательна.';
    if (!formData.end_date) errors.end_date = 'Дата окончания обязательна.';
    if (formData.start_date && formData.end_date && new Date(formData.start_date) > new Date(formData.end_date)) {
        errors.end_date = 'Дата окончания не может быть раньше даты начала.';
    }
    if (!formData.items || formData.items.length === 0) {
        errors.items = 'Добавьте хотя бы одну статью бюджета.';
    } else {
        const itemErrors = [];
        formData.items.forEach((item, index) => {
            const itemError = {};
            if (!item.dds_article_id) itemError.dds_article_id = 'Выберите статью ДДС.';
            if (isNaN(parseFloat(item.budgeted_amount)) || parseFloat(item.budgeted_amount) <= 0) {
                itemError.budgeted_amount = 'Сумма должна быть положительным числом.';
            }
            if (Object.keys(itemError).length > 0) itemErrors[index] = itemError;
        });
        if (itemErrors.length > 0) errors.itemDetails = itemErrors;
    }
    return errors;
};

// Рекурсивная функция для "разглаживания" вложенных статей
const flattenArticles = (articles) => {
    let flatList = [];
    articles.forEach(article => {
        flatList.push(article);
        if (article.children && article.children.length > 0) {
            flatList = flatList.concat(flattenArticles(article.children));
        }
    });
    return flatList;
};


function BudgetForm({ budget, onSuccess, onCancel }) {
    const { activeWorkspace } = useAuth();
    const isEditMode = Boolean(budget);

    const [formData, setFormData] = useState({
        name: budget?.name || '',
        start_date: budget?.start_date || '',
        end_date: budget?.end_date || '',
        items: budget?.budget_items?.map(item => ({
            id: item.id,
            dds_article_id: item.dds_article_id,
            budgeted_amount: item.budgeted_amount.toString(),
        })) || [{ dds_article_id: '', budgeted_amount: '' }],
    });
    const [formErrors, setFormErrors] = useState({});

    const { data: ddsArticles, isLoading: loadingArticles, error: articlesError } = useDataFetching(
        () => activeWorkspace?.id ? apiService.getDdsArticles(activeWorkspace.id) : Promise.resolve([]),
        [activeWorkspace?.id]
    );

    // --- ГЛАВНОЕ ИСПРАВЛЕНИЕ ЗДЕСЬ ---
    const ddsArticleOptions = ddsArticles
        ? flattenArticles(ddsArticles) // 1. "Разглаживаем" древовидную структуру в плоский список
            .filter(article => article.article_type === 'expense') // 2. Оставляем только расходы
            .map(article => ({ // 3. Преобразуем в формат для выпадающего списка
                value: article.id,
                label: article.name,
            }))
        : [];


    const mutationFn = async (data) => {
        if (!activeWorkspace?.id) throw new Error('Активное рабочее пространство не выбрано.');
        const dataToSend = {
            ...data,
            items: data.items.map(item => ({
                dds_article_id: parseInt(item.dds_article_id, 10),
                budgeted_amount: parseFloat(item.budgeted_amount),
                ...(item.id && { id: item.id })
            }))
        };
        if (isEditMode) {
            await apiService.updateBudget(budget.id, dataToSend);
        } else {
            await apiService.createBudget(dataToSend);
        }
    };

    const [submitBudget, isSubmitting, submitError] = useApiMutation(mutationFn, {
        onSuccess: () => {
            if (onSuccess) onSuccess();
        },
    });

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        setFormErrors(prev => ({ ...prev, [name]: null, items: null, itemDetails: null }));
    };

    const handleBudgetItemChange = (index, e) => {
        const { name, value } = e.target;
        const newItems = formData.items.map((item, i) => {
            if (i === index) {
                const newValue = name === 'dds_article_id' ? parseInt(value, 10) : value;
                return { ...item, [name]: newValue };
            }
            return item;
        });
        setFormData(prev => ({ ...prev, items: newItems }));
        setFormErrors(prev => ({ ...prev, items: null, itemDetails: null }));
    };

    const handleAddBudgetItem = () => {
        setFormData(prev => ({ ...prev, items: [...prev.items, { dds_article_id: '', budgeted_amount: '' }] }));
        setFormErrors(prev => ({ ...prev, items: null, itemDetails: null }));
    };

    const handleRemoveBudgetItem = (index) => {
        setFormData(prev => ({ ...prev, items: prev.items.filter((_, i) => i !== index) }));
        setFormErrors(prev => ({ ...prev, items: null, itemDetails: null }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setFormErrors({});
        const validationErrors = validateForm(formData);
        if (Object.keys(validationErrors).length > 0) {
            setFormErrors(validationErrors);
            return;
        }
        await submitBudget(formData);
    };

    return (
        // --- JSX-разметка остается без изменений ---
        <form onSubmit={handleSubmit} className="space-y-6">
            {submitError && <Alert type="error">{submitError}</Alert>}
            {articlesError && <Alert type="error">Ошибка загрузки статей ДДС: {articlesError.message}</Alert>}
            <div>
                <Label htmlFor="name">Название бюджета</Label>
                <Input id="name" name="name" value={formData.name} onChange={handleInputChange} required placeholder="Например, Бюджет на месяц"/>
                {formErrors.name && <p className="text-red-500 text-xs mt-1">{formErrors.name}</p>}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <Label htmlFor="start_date">Дата начала</Label>
                    <Input type="date" id="start_date" name="start_date" value={formData.start_date} onChange={handleInputChange} required />
                    {formErrors.start_date && <p className="text-red-500 text-xs mt-1">{formErrors.start_date}</p>}
                </div>
                <div>
                    <Label htmlFor="end_date">Дата окончания</Label>
                    <Input type="date" id="end_date" name="end_date" value={formData.end_date} onChange={handleInputChange} required />
                    {formErrors.end_date && <p className="text-red-500 text-xs mt-1">{formErrors.end_date}</p>}
                </div>
            </div>
            <h3 className="text-lg font-semibold mt-6">Статьи бюджета</h3>
            {formErrors.items && <p className="text-red-500 text-xs mt-1">{formErrors.items}</p>}
            <div className="space-y-4">
                {formData.items.map((item, index) => (
                    <div key={index} className="flex items-center space-x-3 bg-gray-50 p-3 rounded-md border border-gray-200">
                        <div className="flex-grow">
                            <Label htmlFor={`dds_article_id-${index}`} className="sr-only">Статья ДДС</Label>
                            <Select id={`dds_article_id-${index}`} name="dds_article_id" value={item.dds_article_id} onChange={(e) => handleBudgetItemChange(index, e)} required disabled={loadingArticles}>
                                <option value="">{loadingArticles ? 'Загрузка...' : (ddsArticleOptions.length > 0 ? 'Выберите статью' : 'Нет доступных статей расхода')}</option>
                                {ddsArticleOptions.map(option => (
                                    <option key={option.value} value={option.value}>{option.label}</option>
                                ))}
                            </Select>
                            {formErrors.itemDetails && formErrors.itemDetails[index]?.dds_article_id && (<p className="text-red-500 text-xs mt-1">{formErrors.itemDetails[index].dds_article_id}</p>)}
                        </div>
                        <div className="w-1/3">
                            <Label htmlFor={`budgeted_amount-${index}`} className="sr-only">Запланированная сумма</Label>
                            <Input type="number" id={`budgeted_amount-${index}`} name="budgeted_amount" value={item.budgeted_amount} onChange={(e) => handleBudgetItemChange(index, e)} placeholder="Сумма" step="0.01" required />
                            {formErrors.itemDetails && formErrors.itemDetails[index]?.budgeted_amount && (<p className="text-red-500 text-xs mt-1">{formErrors.itemDetails[index].budgeted_amount}</p>)}
                        </div>
                        {formData.items.length > 1 && (<Button type="button" variant="danger" size="sm" onClick={() => handleRemoveBudgetItem(index)} icon={<MinusCircleIcon className="h-5 w-5" />} className="!p-1" />)}
                    </div>
                ))}
            </div>
            <Button type="button" variant="secondary" onClick={handleAddBudgetItem} icon={<PlusIcon className="h-5 w-5 mr-2" />} className="mt-2">Добавить статью</Button>
            <div className="flex justify-end space-x-2 pt-4">
                <Button type="button" variant="secondary" onClick={onCancel} disabled={isSubmitting}>Отмена</Button>
                <Button type="submit" disabled={isSubmitting}>{isSubmitting ? 'Сохранение...' : (isEditMode ? 'Сохранить изменения' : 'Создать бюджет')}</Button>
            </div>
        </form>
    );
}

export default BudgetForm;