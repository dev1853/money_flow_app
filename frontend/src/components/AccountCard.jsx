// frontend/src/components/AccountCard.jsx (Исправленная версия)

import React from 'react';
// ИСПРАВЛЕНО: Импортируем PencilSquareIcon (solid) и TrashIcon (solid)
import { BanknotesIcon, BuildingLibraryIcon, PencilSquareIcon, TrashIcon } from '@heroicons/react/24/solid'; 
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
    icon: <BuildingLibraryIcon className="h-5 w-5 mr-2 text-gray-500" />,
  },
  cash: {
    label: 'Касса',
    icon: <BanknotesIcon className="h-5 w-5 mr-2 text-gray-500" />,
  },
};

const AccountCard = ({ account, onEdit, onDelete }) => {

  console.log("Данные счета в AccountCard:", account); 
  if (!account) return null;

  const details = account.account_type_ref ? accountTypeDetails[account.account_type_ref.code] : null;
  const balanceColor = account.balance > 0 ? 'text-green-600' : account.balance < 0 ? 'text-red-700' : 'text-gray-700';

  return (
    <div className="bg-white rounded-2xl shadow-lg p-6 flex flex-col justify-between transition-all hover:shadow-xl hover:-translate-y-1">
      <div>
        <div className="flex justify-between items-center mb-2">
          <div className="flex items-center text-sm text-gray-500">
            {details.icon}
            <span>{details.label}</span>
          </div>
          <div className="flex space-x-2">
            {/* ИСПРАВЛЕНО: Убрано size="sm" и PencilIcon заменена на PencilSquareIcon, размер h-5 w-5 */}
            <Button variant="icon" onClick={() => onEdit(account)} title="Редактировать">
              <PencilSquareIcon className="h-5 w-5" />
            </Button>
            {/* ИСПРАВЛЕНО: Убрано size="sm", размер h-5 w-5 */}
            <Button variant="icon" onClick={() => onDelete(account)} className="text-red-600 hover:text-red-800" title="Удалить">
              <TrashIcon className="h-5 w-5" />
            </Button>
          </div>
        </div>

        <h3 className="text-xl font-semibold text-gray-800 mb-1">{account.name}</h3>
        <p className={`text-3xl font-bold ${balanceColor}`}>
          {formatCurrency(account.balance, account.currency)}
        </p>
      </div>

      <div className="mt-4 text-sm text-gray-500">
        {account.description && <p className="mb-1">{account.description}</p>}
        <p>Активен: {account.is_active ? 'Да' : 'Нет'}</p>
        <p>Рабочее пространство: {account.workspace?.name || 'Н/Д'}</p>
        {/* Отображаем информацию о типе счета, если она доступна */}
        {account.account_type_ref && (
          <p>Тип счета: {account.account_type_ref.name}</p>
        )}
      </div>
    </div>
  );
};

export default AccountCard;