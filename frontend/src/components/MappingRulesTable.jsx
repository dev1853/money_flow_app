// frontend/src/components/MappingRulesTable.jsx
import React from 'react';
import Button from './Button';
import { PencilSquareIcon, TrashIcon } from '@heroicons/react/24/solid';
import UniversalTable from './UniversalTable';

const MappingRulesTable = ({ rules, onEdit, onDelete }) => {
  // Определение колонок для UniversalTable
  const headers = [
    {
      label: 'Ключевое слово',
      key: 'keyword',
      className: 'text-left',
    },
    {
      label: 'Статья ДДС',
      key: 'dds_article_name', // Простой ключ для React
      className: 'text-left',
      render: (row) => ( // Используем render для доступа к вложенному объекту dds_article
        <span>{row.dds_article ? row.dds_article.name : 'Неизвестно'}</span>
      ),
    },
    {
      label: 'Тип транзакции',
      key: 'transaction_type',
      className: 'text-left',
      render: (row) => ( // Кастомный рендер для преобразования значения
        <span>
          {row.transaction_type === 'INCOME' ? 'Доход' : (row.transaction_type === 'EXPENSE' ? 'Расход' : 'Не указан')}
        </span>
      ),
    },
    {
      label: 'Приоритет',
      key: 'priority',
      className: 'text-center',
    },
    {
      label: 'Активно',
      key: 'is_active',
      className: 'text-center',
      render: (row) => ( // Кастомный рендер для отображения "Да"/"Нет"
        row.is_active ? (
          <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">Да</span>
        ) : (
          <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">Нет</span>
        )
      ),
    },
    {
      label: 'Действия',
      key: 'actions',
      className: 'text-right',
      render: (row) => ( // Кастомизированный рендер для кнопок действий
        <div className="flex justify-end space-x-2">
          <Button variant="icon" onClick={() => onEdit(row)} title="Редактировать">
            <PencilSquareIcon className="h-5 w-5"/>
          </Button>
          <Button variant="icon" onClick={() => onDelete(row)} className="text-red-600 hover:text-red-800" title="Удалить">
            <TrashIcon className="h-5 w-5"/>
          </Button>
        </div>
      ),
    },
  ];

  return (
    <UniversalTable 
      data={rules} 
      headers={headers} 
      emptyMessage="Пока нет правил сопоставления. Добавьте первое!" 
    />
  );
};

export default MappingRulesTable;