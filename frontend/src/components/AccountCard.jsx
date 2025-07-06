// frontend/src/components/AccountCard.jsx (Исправленная версия)

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

// --- ИСПРАВЛЕНИЕ ЗДЕСЬ: Ключи приведены в НИЖНИЙ регистр для соответствия account_type_ref.code ---
const accountTypeDetails = {
  bank_account: { // Изменено на нижний регистр
    label: 'Банковский счет',
    icon: <BuildingLibraryIcon className="h-5 w-5 mr-2 text-gray-500" />,
  },
  cash: { // Изменено на нижний регистр
    label: 'Касса',
    icon: <BanknotesIcon className="h-5 w-5 mr-2 text-gray-500" />,
  },
};

const AccountCard = ({ account, onEdit, onDelete }) => {

  console.log("Данные счета в AccountCard:", account); 
  if (!account) return null;

  // *** ИСПРАВЛЕНИЕ ЗДЕСЬ: Используем account.account_type_ref.code для поиска деталей ***
  const details = accountTypeDetails[account.account_type_ref?.code] || { label: account.account_type_ref?.name || 'Неизвестный тип', icon: null };
  
  // *** ИСПРАВЛЕНИЕ ЗДЕСЬ: Используем account.balance вместо account.current_balance ***
  const balanceColor = account.balance > 0 ? 'text-green-600' : account.balance < 0 ? 'text-red-700' : 'text-gray-700';

  return (
    <div className="bg-white rounded-2xl shadow-lg p-6 flex flex-col justify-between transition-all hover:shadow-xl hover:-translate-y-1">
      <div>
        <div className="flex justify-between items-center mb-2">
          {/* Эта часть теперь будет работать корректно */}
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
        <h3 className="text-xl font-bold text-gray-800 truncate mb-4">{account.name}</h3>
      </div>
      <div>
        <p className="text-sm text-gray-400 mb-1">Актуальный баланс</p>
        <p className={`text-3xl font-semibold ${balanceColor}`}>
          {/* *** ИСПРАВЛЕНИЕ ЗДЕСЬ: Используем account.balance вместо account.current_balance *** */}
          {formatCurrency(account.balance, account.currency)}
        </p>
      </div>
    </div>
  );
};

export default AccountCard;