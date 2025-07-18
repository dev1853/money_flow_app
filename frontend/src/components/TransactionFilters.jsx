import React, { useMemo, useState } from 'react';

// Импорты UI
import Label from './forms/Label';
import Input from './forms/Input';
import Select from './forms/Select';
import DateRangePicker from './forms/DateRangePicker';
import Button from './Button';
import { XMarkIcon, CalendarIcon, BanknotesIcon, UserIcon } from '@heroicons/react/24/outline';

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
    <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-lg dark:shadow-indigo-500/10 border border-gray-200 dark:border-gray-700 mb-4 animate-fade-in-up">
      {activeAmountFilter && (
        <div className="mb-2 text-sm text-indigo-700 dark:text-indigo-300 font-medium">
          {activeAmountFilter}
        </div>
      )}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-end">
        <div>
          <Label>Период</Label>
          <div className="relative mt-1">
            <DateRangePicker
              startDate={filters.start_date}
              endDate={filters.end_date}
              onStartDateChange={date => onFilterChange('start_date', date)}
              onEndDateChange={date => onFilterChange('end_date', date)}
              icon={CalendarIcon}
            />
          </div>
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
            icon={BanknotesIcon}
          />
        </div>
        <div>
          <Label htmlFor="counterparty_id">Контрагент</Label>
          <Select
            id="counterparty_id"
            value={filters.counterparty_id}
            onChange={e => onFilterChange('counterparty_id', e.target.value)}
            options={counterpartyOptions}
            icon={UserIcon}
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
              icon={BanknotesIcon}
            />
            <Input
              type="number"
              id="amount_to"
              placeholder="до"
              value={filters.amount_to}
              onChange={e => handleAmountChange('to', e.target.value)}
              min={0}
              error={amountErrors.to}
              icon={BanknotesIcon}
            />
          </div>
        </div>
        <div className="flex justify-end">
          <Button
            variant="icon"
            onClick={onResetFilters}
            title="Сбросить фильтры"
            className="p-2 rounded-full bg-transparent hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            <XMarkIcon className="h-5 w-5 text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400" />
            <span className="sr-only">Сбросить фильтры</span>
          </Button>
        </div>
      </div>
    </div>
  );
};

export default TransactionFilters;