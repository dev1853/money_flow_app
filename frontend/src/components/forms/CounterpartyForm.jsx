// frontend/src/components/forms/CounterpartyForm.jsx

import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
// import { apiService } from '../../services/apiService'; // Больше не нужен напрямую для API-вызовов
import Input from './Input';
import Select from './Select';
import Button from '../Button';
import Alert from '../Alert';
import Loader from '../Loader';
import { CounterpartyType } from '../../utils/constants'; 

// ИСПРАВЛЕНО: Теперь принимаем onSubmit, onCancel, isSubmitting, error от родителя
function CounterpartyForm({ counterparty: counterpartyToEdit, onSubmit, onCancel, isSubmitting, error: submissionError }) {
    const { activeWorkspace, fetchDataForWorkspace } = useAuth(); // fetchDataForWorkspace может быть не нужен, если он не используется для AuthContext в этой форме
    const [formData, setFormData] = useState({
        name: '',
        type: CounterpartyType.OTHER, 
        inn: '',
        contact_person: '',
        contact_info: ''
    });
    // УДАЛЕНЫ локальные состояния loading и error, они приходят от родителя через пропсы.
    // const [loading, setLoading] = useState(false);
    // const [error, setError] = useState('');
    // УДАЛЕНО: Это состояние и useEffect, который его заполняет, не нужны в форме для создания/редактирования ОДНОГО контрагента.
    // const [counterparties, setCounterparties] = useState([]); 

    const counterpartyTypeOptions = Object.values(CounterpartyType).map(type => ({
        value: type,
        label: {
            [CounterpartyType.CLIENT]: "Клиент",
            [CounterpartyType.SUPPLIER]: "Поставщик",
            [CounterpartyType.EMPLOYEE]: "Сотрудник",
            [CounterpartyType.OTHER]: "Прочее",
        }[type] 
    }));

    useEffect(() => {
        if (counterpartyToEdit) {
            setFormData({
                name: counterpartyToEdit.name || '',
                type: counterpartyToEdit.type || CounterpartyType.OTHER,
                inn: counterpartyToEdit.inn || '',
                contact_person: counterpartyToEdit.contact_person || '',
                contact_info: counterpartyToEdit.contact_info || ''
            });
        } else {
            setFormData(prev => ({
                ...prev,
                name: '',
                type: CounterpartyType.OTHER,
                inn: '',
                contact_person: '',
                contact_info: ''
            }));
        }
    }, [counterpartyToEdit]); 

    // УДАЛЕН useEffect для fetchCounterparties, так как он не нужен для этой формы.
    /*
    useEffect(() => {
        const fetchCounterparties = async () => {
            if (activeWorkspace?.id) {
                try {
                    // setError(''); 
                    const fetchedCounterparties = await apiService.getCounterparties({
                        workspace_id: activeWorkspace.id
                    });
                    setCounterparties(fetchedCounterparties?.items || []); 
                } catch (err) {
                    console.error('Ошибка при загрузке контрагентов для формы договора:', err);
                    // setError(err.message || 'Не удалось загрузить контрагентов.'); 
                }
            }
        };
        fetchCounterparties();
    }, [activeWorkspace]);
    */

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        // setLoading(true); // УДАЛЕН локальный стейт загрузки
        // setError(''); // УДАЛЕН локальный стейт ошибки

        try {
            const dataToSend = {
                ...formData,
                inn: formData.inn ? formData.inn : null, // отправляем null вместо пустой строки
            };

            // Валидация
            if (!dataToSend.name) {
                throw new Error("Название контрагента обязательно.");
            }
            if (!dataToSend.type) {
                throw new Error("Тип контрагента обязателен.");
            }

            // ИСПРАВЛЕНО: Вызываем пропс onSubmit, делегируя API-вызов родительскому компоненту
            await onSubmit(dataToSend);
            
            // После того, как onSubmit завершится успешно (это значит, что useApiMutation в родителе сработал),
            // дальнейшая логика (закрытие модального окна и обновление таблицы) будет обработана в родителе.
            // Поэтому, здесь не нужно вызывать onSuccess() или fetchDataForWorkspace().

        } catch (err) {
            // Ошибки валидации формы, которые не зависят от API, обрабатываются здесь
            // Ошибки API будут переданы через пропс submissionError
            throw err; 
        } finally {
            // setLoading(false); // УДАЛЕН локальный стейт загрузки
        }
    };

    // ИСПРАВЛЕНО: Используем пропс isSubmitting для состояния загрузки
    if (isSubmitting) { 
        return <Loader text="Сохранение..." />;
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            {/* ИСПРАВЛЕНО: Используем пропс submissionError для отображения ошибки */}
            {submissionError && <Alert type="error">{submissionError.message || 'Произошла ошибка при сохранении.'}</Alert>}
            <Input
                label="Название контрагента"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
            />
            <Select
                label="Тип контрагента"
                name="type"
                value={formData.type}
                onChange={handleChange}
                options={counterpartyTypeOptions}
                required
            />
            <Input
                label="ИНН (опционально)"
                name="inn"
                value={formData.inn}
                onChange={handleChange}
            />
            <Input
                label="Контактное лицо (опционально)"
                name="contact_person"
                value={formData.contact_person}
                onChange={handleChange}
            />
            <Input
                label="Контактная информация (опционально)"
                name="contact_info"
                value={formData.contact_info}
                onChange={handleChange}
            />
            <Button 
                type="submit" 
                className="w-full" 
                disabled={isSubmitting || !activeWorkspace?.id} // ИСПРАВЛЕНО: Используем isSubmitting
            >
                {isSubmitting ? <Loader text="Сохранение..." /> : (counterpartyToEdit ? 'Сохранить изменения' : 'Создать контрагента')}</Button>
        </form>
    );
}

export default CounterpartyForm;