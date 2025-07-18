import React from 'react';
import { PencilIcon, TrashIcon } from '@heroicons/react/24/solid';
import Button from './Button';
import { CounterpartyType } from '../utils/constants'; 

function CounterpartyCard({ counterparty, onEdit, onDelete, onClick }) {
    const translatedType = {
        [CounterpartyType.CLIENT]: "Клиент",
        [CounterpartyType.SUPPLIER]: "Поставщик",
        [CounterpartyType.EMPLOYEE]: "Сотрудник",
        [CounterpartyType.OTHER]: "Прочее",
    }[counterparty.type] || counterparty.type;

    return (
        <div
            className="group relative flex flex-col bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl shadow-md hover:shadow-lg transition-shadow duration-200 overflow-hidden cursor-pointer hover:border-indigo-500 dark:hover:border-indigo-400 focus-within:ring-2 focus-within:ring-indigo-500"
            tabIndex={0}
            onClick={onClick}
        >
            <div className="absolute top-3 right-3 flex space-x-1 z-10">
                <Button 
                    small 
                    variant="icon"
                    icon={<PencilIcon className="h-4 w-4" />} 
                    onClick={e => { e.stopPropagation(); onEdit(counterparty); }}
                    aria-label="Редактировать контрагента"
                />
                <Button 
                    small 
                    variant="danger" 
                    icon={<TrashIcon className="h-4 w-4" />} 
                    onClick={e => { e.stopPropagation(); onDelete(counterparty); }}
                    aria-label="Удалить контрагента"
                />
            </div>
            <div className="p-6 flex-1 flex flex-col justify-between">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-1 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors truncate">
                    {counterparty.name}
                </h3>
                <div className="mb-2">
                    <span className="inline-block px-2 py-0.5 rounded-full text-xs font-semibold bg-indigo-100 text-indigo-800 dark:bg-indigo-900/40 dark:text-indigo-200">
                        {translatedType}
                    </span>
                </div>
                <div className="space-y-1 text-sm text-gray-700 dark:text-gray-300">
                    {counterparty.inn && <p><span className="font-medium text-gray-500 dark:text-gray-400">ИНН:</span> {counterparty.inn}</p>}
                    {counterparty.contact_person && <p><span className="font-medium text-gray-500 dark:text-gray-400">Контактное лицо:</span> {counterparty.contact_person}</p>}
                    {counterparty.contact_info && <p><span className="font-medium text-gray-500 dark:text-gray-400">Контакты:</span> {counterparty.contact_info}</p>}
                </div>
            </div>
        </div>
    );
}

export default CounterpartyCard;