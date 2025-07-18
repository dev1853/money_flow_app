import React, { useMemo, useState } from 'react';

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
  const [amountErrors, setAmountErrors] = useState({ from: '', to: '' });

  // Валидация суммы на лету
  const handleAmountChange = (field, value) => {
    let error = '';
    if (value !== '' && (isNaN(value) || Number(value) < 0)) {
      error = 'Введите неотрицательное число';
    }
    setAmountErrors(prev => ({ ...prev, [field]: error }));
    onFilterChange(field === 'from' ? 'amount_from' : 'amount_to', value);
  };

  // Активные фильтры по сумме
  const activeAmountFilter = useMemo(() => {
    const from = filters.amount_from;
    const to = filters.amount_to;
    if (from !== '' && to !== '') return `Сумма: от ${from} до ${to}`;
    if (from !== '') return `Сумма: от ${from}`;
    if (to !== '') return `Сумма: до ${to}`;
    return null;
  }, [filters.amount_from, filters.amount_to]);

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
      {activeAmountFilter && (
        <div className="mb-2 text-sm text-indigo-700 dark:text-indigo-300 font-medium">
          {activeAmountFilter}
        </div>
      )}
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
              onChange={e => handleAmountChange('from', e.target.value)}
              min={0}
              error={amountErrors.from}
            />
            <Input
              type="number"
              id="amount_to"
              placeholder="до"
              value={filters.amount_to}
              onChange={e => handleAmountChange('to', e.target.value)}
              min={0}
              error={amountErrors.to}
            />
          </div>
        </div>

        <div className="ml-auto">
          {/* Этот Button уже должен быть адаптирован */}
          <Button variant="icon" onClick={onResetFilters} title="Сбросить все фильтры">
            <XMarkIcon className="h-5 w-5 mr-2" />
            Сбросить
          </Button>
        </div>
      </div>
    </div>
  );
};

export default TransactionFilters;