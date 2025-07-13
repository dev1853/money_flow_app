// frontend/src/components/CounterpartyCard.jsx

import React from 'react';
import { PencilIcon, TrashIcon } from '@heroicons/react/24/solid';
import Button from './Button';
import { CounterpartyType } from '../utils/constants'; 

function CounterpartyCard({ counterparty, onEdit, onDelete }) {
    const translatedType = {
        [CounterpartyType.CLIENT]: "Клиент",
        [CounterpartyType.SUPPLIER]: "Поставщик",
        [CounterpartyType.EMPLOYEE]: "Сотрудник",
        [CounterpartyType.OTHER]: "Прочее",
    }[counterparty.type] || counterparty.type;

    return (
        <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200 hover:shadow-lg transition-shadow duration-200">
            <div className="flex justify-between items-start mb-4">
                <h3 className="text-xl font-semibold text-gray-900">{counterparty.name}</h3>
                <div className="flex space-x-2">
                    <Button 
                        small 
                        icon={<PencilIcon className="h-4 w-4" />} 
                        onClick={() => onEdit(counterparty)}
                        aria-label="Редактировать контрагента"
                    />
                    <Button 
                        small 
                        variant="danger" 
                        icon={<TrashIcon className="h-4 w-4" />} 
                        onClick={() => onDelete(counterparty)}
                        aria-label="Удалить контрагента"
                    />
                </div>
            </div>
            
            <div className="space-y-2 text-sm text-gray-700">
                <p><strong>Тип:</strong> <span className="font-medium text-indigo-600">{translatedType}</span></p>
                {/* ИСПРАВЛЕНИЕ: N/A на '-' */}
                {counterparty.inn && <p><strong>ИНН:</strong> {counterparty.inn || '-'}</p>} 
                {counterparty.contact_person && <p><strong>Контактное лицо:</strong> {counterparty.contact_person || '-'}</p>}
                {counterparty.contact_info && <p><strong>Контактная информация:</strong> {counterparty.contact_info || '-'}</p>}
            </div>
        </div>
    );
}

export default CounterpartyCard;