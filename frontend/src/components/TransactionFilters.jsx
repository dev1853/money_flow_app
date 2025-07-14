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
  counterparties,
  onFilterChange,
  onResetFilters,
}) => {
  const counterpartyOptions = [
    { value: 'all', label: 'Все контрагенты' },
    ...(counterparties || []).map(cp => ({
      value: cp.id,
      label: cp.name
    }))
  ];

  return (
    // 1. Адаптируем фон, тень и границу контейнера
    <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm dark:shadow-2xl dark:shadow-indigo-500/10 mb-4 border border-gray-200 dark:border-gray-700">
      <div className="flex flex-wrap items-end gap-4">
        
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
            options={[
              { value: 'all', label: 'Все счета' },
              ...(accounts || []).map(acc => ({
                value: acc.id,
                label: acc.name
              }))
            ]}
          />
        </div>

        <div>
          <Label htmlFor="counterparty_id">Контрагент</Label>
          <Select
            id="counterparty_id"
            value={filters.counterparty_id}
            onChange={e => onFilterChange('counterparty_id', e.target.value)}
            options={counterpartyOptions}
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

        <div className="ml-auto">
          {/* Этот Button уже должен быть адаптирован */}
          <Button variant="icon" onClick={onResetFilters}>
            <XMarkIcon className="h-5 w-5 mr-2" />
            Сбросить
          </Button>
        </div>
      </div>
    </div>
  );
};

export default TransactionFilters;