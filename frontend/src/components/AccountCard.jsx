// frontend/src/components/AccountCard.jsx

import React from 'react';
import { BanknotesIcon, BuildingLibraryIcon, PencilIcon, TrashIcon } from '@heroicons/react/24/outline';
import Button from './Button';

// Вспомогательная функция для форматирования валюты
const formatCurrency = (amount, currency) => {
  return new Intl.NumberFormat('ru-RU', {
    style: 'currency',
    currency: currency || 'RUB',
    minimumFractionDigits: 2,
  }).format(amount);
};

// Вспомогательный объект для данных по типам счетов
const accountTypeDetails = {
  bank_account: {
    label: 'Банковский счет',
    icon: <BuildingLibraryIcon className="h-5 w-5 mr-2 text-gray-500" />,
  },
  cash_box: {
    label: 'Касса',
    icon: <BanknotesIcon className="h-5 w-5 mr-2 text-gray-500" />,
  },
};

const AccountCard = ({ account, onEdit, onDelete }) => {
  const details = accountTypeDetails[account.account_type] || { label: account.account_type, icon: null };

  return (
    <div className="bg-white rounded-2xl shadow-lg p-6 flex flex-col justify-between transition-all hover:shadow-xl hover:-translate-y-1">
      <div>
        {/* Верхняя часть карточки: тип и действия */}
        <div className="flex justify-between items-center mb-2">
          <div className="flex items-center text-sm text-gray-500">
            {details.icon}
            <span>{details.label}</span>
          </div>
          <div className="flex space-x-2">
            <Button variant="icon" size="sm" onClick={() => onEdit(account)}>
              <PencilIcon className="h-4 w-4" />
            </Button>
            <Button variant="icon" size="sm" onClick={() => onDelete(account)} className="text-red-500 hover:text-red-700">
              <TrashIcon className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Название счета */}
        <h3 className="text-xl font-bold text-gray-800 truncate mb-4">{account.name}</h3>
      </div>

      {/* Нижняя часть карточки: баланс */}
      <div>
        <p className="text-sm text-gray-400 mb-1">Актуальный баланс</p>
        <p className="text-3xl font-semibold text-gray-900">
          {formatCurrency(account.current_balance, account.currency)}
        </p>
      </div>
    </div>
  );
};

export default AccountCard;