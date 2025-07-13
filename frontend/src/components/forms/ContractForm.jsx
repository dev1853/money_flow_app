// frontend/src/components/forms/ContractForm.jsx

import React, { useState, useEffect, useMemo } from 'react'; // Добавлен useMemo
import { useAuth } from '../../contexts/AuthContext';
import { apiService } from '../../services/apiService';
import Input from './Input';
import Textarea from './Textarea';
import DatePicker from './DatePicker';
import Select from './Select';
import Button from '../Button';
import Alert from '../Alert';
import Loader from '../Loader';
import { ContractStatus } from '../../utils/constants'; 
import { parseISO } from 'date-fns'; 

// ИСПРАВЛЕНО: Теперь принимаем onSubmit, onCancel, isSubmitting, error от родителя
function ContractForm({ contract: contractToEdit, onSubmit, onCancel, isSubmitting, error: submissionError }) {
    const { activeWorkspace } = useAuth(); // fetchDataForWorkspace может быть не нужен, если он не используется для AuthContext в этой форме

    // --- ОТЛАДОЧНЫЙ ЛОГ: Проверка пропса onSubmit ---
    console.log("ContractForm: Тип onSubmit пропса:", typeof onSubmit);
    console.log("ContractForm: Значение onSubmit пропса:", onSubmit);
    // --- КОНЕЦ ОТЛАДОЧНОГО ЛОГА ---

    const [formData, setFormData] = useState({
        name: '',
        description: '',
        start_date: new Date().toISOString().split('T')[0], 
        end_date: '',
        value: '',
        status: ContractStatus.ACTIVE, 
        counterparty_id: ''
    });
    const [counterparties, setCounterparties] = useState([]); 

    useEffect(() => {
        if (contractToEdit) {
            setFormData({
                name: contractToEdit.name || '',
                description: contractToEdit.description || '',
                start_date: contractToEdit.start_date || '',
                end_date: contractToEdit.end_date || '',
                value: contractToEdit.value !== null ? String(contractToEdit.value) : '', 
                status: contractToEdit.status || ContractStatus.ACTIVE,
                counterparty_id: contractToEdit.counterparty_id || ''
            });
        } else {
            setFormData(prev => ({
                ...prev,
                name: '',
                description: '',
                start_date: new Date().toISOString().split('T')[0], 
                end_date: '',
                value: '',
                status: ContractStatus.ACTIVE, 
                counterparty_id: '', 
            }));
        }
    }, [contractToEdit]); 

    useEffect(() => {
        const fetchCounterparties = async () => {
            if (activeWorkspace?.id) {
                try {
                    const fetchedCounterparties = await apiService.getCounterparties({
                        workspace_id: activeWorkspace.id
                    });
                    setCounterparties(fetchedCounterparties?.items || []); 
                } catch (err) {
                    console.error('Ошибка при загрузке контрагентов для формы договора:', err);
                }
            }
        };
        fetchCounterparties();
    }, [activeWorkspace]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleDateChange = (name, date) => {
        setFormData(prev => ({ ...prev, [name]: date ? date.toISOString().split('T')[0] : null }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        try {
            const dataToSend = {
                ...formData,
                value: formData.value !== '' ? parseFloat(formData.value) : null,
                counterparty_id: formData.counterparty_id !== '' ? parseInt(formData.counterparty_id) : null
            };

            // Валидация
            if (!dataToSend.name) {
                throw new Error("Название договора обязательно.");
            }
            if (!dataToSend.start_date) {
                throw new Error("Дата начала договора обязательна.");
            }
            if (!dataToSend.counterparty_id) {
                throw new Error("Контрагент обязателен.");
            }

            // ИСПРАВЛЕНО: Вызываем пропс onSubmit, делегируя API-вызов родительскому компоненту
            await onSubmit(dataToSend);
            
        } catch (err) {
            throw err; 
        } finally {
        }
    };

    const statusOptions = Object.values(ContractStatus).map(status => ({
        value: status,
        label: {
            [ContractStatus.ACTIVE]: "Активен",
            [ContractStatus.COMPLETED]: "Завершен",
            [ContractStatus.ARCHIVED]: "Архив",
            [ContractStatus.PENDING]: "Ожидает",
        }[status]
    }));

    const counterpartyOptions = counterparties.map(cp => ({
        value: cp.id,
        label: cp.name
    }));

    if (isSubmitting) { 
        return <Loader text="Сохранение..." />;
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            {submissionError && <Alert type="error">{submissionError.message || 'Произошла ошибка при сохранении.'}</Alert>}
            <Input
                label="Название договора"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
            />
            <Textarea
                label="Описание (опционально)"
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows={3}
            />
            <DatePicker
                label="Дата начала договора"
                name="start_date"
                selectedDate={formData.start_date ? parseISO(formData.start_date) : null} 
                onChange={(date) => handleDateChange('start_date', date)}
                required
            />
            <DatePicker
                label="Дата окончания договора (опционально)"
                name="end_date"
                selectedDate={formData.end_date ? parseISO(formData.end_date) : null} 
                onChange={(date) => handleDateChange('end_date', date)}
            />
            <Input
                label="Сумма договора (опционально)"
                name="value"
                type="number"
                value={formData.value}
                onChange={handleChange}
                min="0"
                step="0.01"
            />
            <Select
                label="Статус договора"
                name="status"
                value={formData.status}
                onChange={handleChange}
                options={statusOptions}
                required
            />
            <Select
                label="Контрагент"
                name="counterparty_id"
                value={formData.counterparty_id}
                onChange={handleChange}
                options={counterpartyOptions}
                required
                placeholder="Выберите контрагента"
                disabled={isSubmitting || !activeWorkspace?.id || counterparties.length === 0} 
            />
            <Button 
                type="submit" 
                className="w-full" 
                disabled={isSubmitting || !activeWorkspace?.id || counterparties.length === 0} 
            >
                {isSubmitting ? <Loader text="Сохранение..." /> : (contractToEdit ? 'Сохранить изменения' : 'Создать договор')}</Button>
        </form>
    );
}

export default ContractForm;