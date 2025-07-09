// frontend/src/components/forms/PlannedPaymentForm.jsx

import React, { useState } from 'react';
import { useApiMutation } from '../../hooks/useApiMutation';
import { apiService } from '../../services/apiService';
import Button from '../Button';
import Input from './Input';
import Label from './Label';
import Select from './Select';
import Alert from '../Alert';
import Checkbox from './Checkbox';
import DatePicker from './DatePicker'; // <-- 1. Импортируем DatePicker
import { toISODateString } from '../../utils/dateUtils'; // Импортируем утилиту для формата даты

const PlannedPaymentForm = ({ payment, onSave, onCancel, selectedDate }) => {
    const isEditMode = Boolean(payment);
    
    // Преобразуем строковую дату в объект Date для DatePicker
    const initialDate = payment?.payment_date ? new Date(payment.payment_date) : (selectedDate ? new Date(selectedDate) : null);

    const [formData, setFormData] = useState({
        description: payment?.description || '',
        amount: payment?.amount ? String(payment.amount) : '',
        payment_type: payment?.payment_type || 'EXPENSE',
        payment_date: initialDate, // Используем объект Date для состояния
        is_recurring: payment?.is_recurring || false,
        recurrence_rule: payment?.recurrence_rule || 'monthly',
    });

    const mutationFn = async (data) => {
        const dataToSend = { 
            ...data, 
            amount: parseFloat(data.amount),
            // Перед отправкой в API форматируем дату в строку 'YYYY-MM-DD'
            payment_date: toISODateString(data.payment_date),
        };

        if (!dataToSend.is_recurring) {
            delete dataToSend.recurrence_rule;
        }
        
        if (isEditMode) {
            await apiService.updatePlannedPayment(payment.id, dataToSend);
        } else {
            await apiService.createPlannedPayment(dataToSend);
        }
    };

    const [submitPayment, isSubmitting, error] = useApiMutation(mutationFn, {
        onSuccess: onSave,
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        submitPayment(formData);
    };

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        const val = type === 'checkbox' ? checked : value;
        setFormData(prev => ({ ...prev, [name]: val }));
    };

    // Отдельный обработчик для DatePicker
    const handleDateChange = (date) => {
        setFormData(prev => ({ ...prev, payment_date: date }));
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <h3 className="text-lg font-semibold">{isEditMode ? 'Редактировать платеж' : 'Новый запланированный платеж'}</h3>
            {error && <Alert type="error">{error.message}</Alert>}

            <div>
                <Label htmlFor="description">Описание</Label>
                <Input id="description" name="description" value={formData.description} onChange={handleChange} required />
            </div>
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <Label htmlFor="amount">Сумма</Label>
                    <Input id="amount" name="amount" type="number" value={formData.amount} onChange={handleChange} required step="0.01" />
                </div>
                <div>
                    <Label htmlFor="payment_type">Тип</Label>
                    <Select id="payment_type" name="payment_type" value={formData.payment_type} onChange={handleChange}>
                        <option value="EXPENSE">Расход</option>
                        <option value="INCOME">Доход</option>
                    </Select>
                </div>
            </div>
             <div>
                {/* --- 2. ИСПОЛЬЗУЕМ DatePicker ВМЕСТО Input --- */}
                <Label htmlFor="payment_date">Дата платежа</Label>
                <DatePicker
                    selected={formData.payment_date}
                    onChange={handleDateChange}
                />
            </div>
            
            <div className="space-y-2 rounded-md border border-gray-200 p-3">
                <Checkbox
                    id="is_recurring"
                    name="is_recurring"
                    checked={formData.is_recurring}
                    onChange={handleChange}
                    label="Сделать платеж регулярным"
                />
                {formData.is_recurring && (
                    <div className="pl-6 pt-2">
                        <Label htmlFor="recurrence_rule">Повторять</Label>
                        <Select id="recurrence_rule" name="recurrence_rule" value={formData.recurrence_rule} onChange={handleChange}>
                            <option value="monthly">Каждый месяц</option>
                            <option value="weekly">Каждую неделю</option>
                            <option value="daily">Каждый день</option>
                        </Select>
                    </div>
                )}
            </div>

            <div className="flex justify-end space-x-2 pt-2">
                <Button type="button" variant="secondary" onClick={onCancel} disabled={isSubmitting}>Отмена</Button>
                <Button type="submit" disabled={isSubmitting}>{isSubmitting ? 'Сохранение...' : 'Сохранить'}</Button>
            </div>
        </form>
    );
};

export default PlannedPaymentForm;