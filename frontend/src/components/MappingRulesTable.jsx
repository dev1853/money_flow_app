// frontend/src/components/MappingRulesTable.jsx
import React from 'react';
import Button from './Button';
import { PencilIcon, TrashIcon } from '@heroicons/react/24/outline';
import UniversalTable from './UniversalTable';

const MappingRulesTable = ({ rules, onEdit, onDelete }) => {
  // Определение колонок для UniversalTable
  const columns = [
    {
      header: 'Ключевое слово',
      accessor: 'keyword',
      align: 'left',
      // render не нужен, если UniversalTable рендерит по умолчанию и keyword не требует спец. форматирования
      // Если нужны специфичные стили, добавить их в render: (row) => (<span className="my-custom-class">{row.keyword}</span>),
    },
    {
      header: 'Статья ДДС',
      accessor: 'dds_article.name',
      align: 'left',
      render: (row) => ( // Используем render для доступа к вложенному объекту dds_article
        <span>{row.dds_article ? row.dds_article.name : 'Неизвестно'}</span>
      ),
    },
    {
      header: 'Тип транзакции',
      accessor: 'transaction_type',
      align: 'left',
      render: (row) => ( // Кастомный рендер для преобразования значения
        <span>
          {row.transaction_type === 'income' ? 'Доход' : (row.transaction_type === 'expense' ? 'Расход' : 'Оба')}
        </span>
      ),
    },
    {
      header: 'Приоритет',
      accessor: 'priority',
      align: 'center',
    },
    {
      header: 'Активно',
      accessor: 'is_active',
      align: 'center',
      render: (row) => ( // Кастомный рендер для отображения "Да"/"Нет"
        row.is_active ? (
          <span className="text-green-500">Да</span>
        ) : (
          <span className="text-red-500">Нет</span>
        )
      ),
    },
    {
      header: 'Действия',
      accessor: 'actions',
      align: 'right', // Выравнивание кнопок вправо
      render: (row) => ( // Кастомизированный рендер для кнопок действий
        <>
          <Button variant="outline" size="sm" className="mr-2" onClick={() => onEdit(row)}>
            <PencilIcon className="h-4 w-4" />
          </Button>
          <Button variant="danger" size="sm" onClick={() => onDelete(row)}>
            <TrashIcon className="h-4 w-4" />
          </Button>
        </>
      ),
    },
  ];

  return (
    <UniversalTable 
      data={rules} 
      columns={columns} 
      emptyMessage="Пока нет правил сопоставления. Добавьте первое!" 
    />
  );
};

export default MappingRulesTable;