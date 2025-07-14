import React from 'react';
import { BanknotesIcon, BuildingLibraryIcon, PencilIcon, TrashIcon } from '@heroicons/react/24/outline';
import Button from './Button';

const formatCurrency = (amount, currency) => {
  const number = Number(amount) || 0;
  return new Intl.NumberFormat('ru-RU', {
    style: 'currency',
    currency: currency || 'RUB',
  }).format(number);
};

const accountTypeDetails = {
  bank_account: {
    label: 'Банковский счет',
    icon: BuildingLibraryIcon, // Pass the component itself
  },
  cash: {
    label: 'Касса',
    icon: BanknotesIcon, // Pass the component itself
  },
};

const AccountCard = ({ account, onEdit, onDelete }) => {
  if (!account) return null;

  const details = accountTypeDetails[account.account_type_ref?.code] || { label: account.account_type_ref?.name || 'Неизвестный тип', icon: null };
  const TypeIcon = details.icon; // Get the icon component

  const balanceColor = account.balance > 0
    ? 'text-green-600 dark:text-green-400'
    : account.balance < 0
    ? 'text-red-600 dark:text-red-400'
    : 'text-gray-700 dark:text-gray-300';

  return (
    // 1. Адаптируем фон, тень и границу карточки
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg dark:shadow-2xl dark:shadow-indigo-500/10 p-6 flex flex-col justify-between transition-all hover:shadow-xl hover:-translate-y-1 border border-gray-200 dark:border-gray-700">
      <div>
        <div className="flex justify-between items-center mb-2">
          {/* 2. Адаптируем цвет текста и иконки типа счета */}
          <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
            {TypeIcon && <TypeIcon className="h-5 w-5 mr-2" />}
            <span>{details.label}</span>
          </div>
          <div className="flex space-x-2">
            {/* Компонент Button уже должен быть адаптирован */}
            <Button variant="icon" size="sm" onClick={() => onEdit(account)}>
              <PencilIcon className="h-4 w-4" />
            </Button>
            <Button variant="icon" size="sm" onClick={() => onDelete(account)} className="text-red-500 hover:text-red-700 dark:text-red-500 dark:hover:text-red-400">
              <TrashIcon className="h-4 w-4" />
            </Button>
          </div>
        </div>
        {/* 3. Адаптируем цвет названия счета */}
        <h3 className="text-xl font-bold text-gray-800 dark:text-gray-100 truncate mb-4">{account.name}</h3>
      </div>
      <div>
        {/* 4. Адаптируем цвет текста подписи */}
        <p className="text-sm text-gray-400 dark:text-gray-500 mb-1">Актуальный баланс</p>
        {/* 5. Динамический цвет баланса уже адаптирован в переменной balanceColor */}
        <p className={`text-3xl font-semibold ${balanceColor}`}>
          {formatCurrency(account.balance, account.currency)}
        </p>
      </div>
    </div>
  );
};

export default AccountCard;