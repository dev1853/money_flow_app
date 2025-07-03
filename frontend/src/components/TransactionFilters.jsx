// frontend/src/components/TransactionFilters.jsx

import React from 'react';

// Импорты UI
import Label from './forms/Label';
import Input from './forms/Input';
import Select from './forms/Select';
import DateRangePicker from './forms/DateRangePicker';
import Button from './Button';
import { XMarkIcon } from '@heroicons/react/24/solid';

const TransactionFilters = ({
  filters,
  accounts,
  onFilterChange,
  onResetFilters,
}) => {
  return (
    <div className="bg-white p-4 rounded-lg shadow-sm mb-4">
      {/* ИЗМЕНЕНИЕ: Заменяем grid на flex, добавляем flex-wrap для адаптивности 
        и gap для отступов между элементами. items-end выравнивает все по нижней границе.
      */}
      <div className="flex flex-wrap items-end gap-4">
        
        {/* Каждый фильтр теперь - это просто элемент flex-контейнера */}
        <div>
          <Label>Период</Label>
          <DateRangePicker
            startDate={filters.start_date}
            endDate={filters.end_date}
            onStartDateChange={date => onFilterChange('start_date', date)}
            onEndDateChange={date => onFilterChange('end_date', date)}
          />
        </div>

        <div>
          <Label htmlFor="account_id">Счет</Label>
          <Select
            id="account_id"
            value={filters.account_id}
            onChange={e => onFilterChange('account_id', e.target.value)}
          >
            <option value="all">Все счета</option>
            {accounts.map(acc => (
              <option key={acc.id} value={acc.id}>
                {acc.name}
              </option>
            ))}
          </Select>
        </div>

        <div>
          <Label htmlFor="contractor">Контрагент</Label>
          <Input
            type="text"
            id="contractor"
            placeholder="Название или ИНН"
            disabled
            value={filters.contractor}
            onChange={e => onFilterChange('contractor', e.target.value)}
          />
        </div>

        <div>
          <Label>Сумма</Label>
          <div className="flex items-center gap-2">
            <Input
              type="number"
              id="amount_from"
              placeholder="от"
              value={filters.amount_from}
              onChange={e => onFilterChange('amount_from', e.target.value)}
            />
            <Input
              type="number"
              id="amount_to"
              placeholder="до"
              value={filters.amount_to}
              onChange={e => onFilterChange('amount_to', e.target.value)}
            />
          </div>
        </div>

        {/* ИЗМЕНЕНИЕ: Кнопка сброса теперь является частью flex-контейнера.
          Мы можем добавить ей отступ, чтобы она прижалась к правому краю.
        */}
        <div className="ml-auto">
          <Button variant="secondary" onClick={onResetFilters}>
            <XMarkIcon className="h-5 w-5 mr-2" />
            Сбросить
          </Button>
        </div>
      </div>
    </div>
  );
};

export default TransactionFilters;