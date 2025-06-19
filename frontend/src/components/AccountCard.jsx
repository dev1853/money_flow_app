import React from 'react';
import Button from './Button';
// --- Шаг 1: Импортируем иконки ---
import { 
  PencilSquareIcon, 
  TrashIcon,
  BuildingLibraryIcon, // Для банковского счета
  BanknotesIcon,       // Для наличных
  ArchiveBoxIcon       // Для сейфа
} from '@heroicons/react/24/outline';

const ACCOUNT_TYPE_LABELS = {
  bank_account: 'Банковский счет',
  cash: 'Наличные',
  safe: 'Сейф',
};

// --- Шаг 2: Создаем объект для сопоставления иконок ---
// Мы передаем className, чтобы иконки были одного размера и цвета.
const ACCOUNT_ICONS = {
  bank_account: <BuildingLibraryIcon className="h-6 w-6 text-gray-400" />,
  cash: <BanknotesIcon className="h-6 w-6 text-gray-400" />,
  safe: <ArchiveBoxIcon className="h-6 w-6 text-gray-400" />,
  default: <div className="h-6 w-6 bg-gray-300 rounded-full" /> // Иконка по умолчанию
};


function AccountCard({ account, onEdit, onDelete }) {
  if (!account) {
    return null;
  }

  const isActive = account.is_active;
  const balanceColor = account.current_balance >= 0 ? 'text-gray-900' : 'text-red-600';
  
  // Выбираем нужную иконку или иконку по умолчанию
  const Icon = ACCOUNT_ICONS[account.account_type] || ACCOUNT_ICONS.default;

  return (
    <div className={`bg-white shadow-lg rounded-xl overflow-hidden transform transition-all hover:scale-105 hover:shadow-xl`}>
      <div className={`p-5 border-l-4 ${isActive ? 'border-green-500' : 'border-gray-300'}`}>
        <div className="flex justify-between items-start">
          <div className="flex items-center space-x-4">
            {/* --- Шаг 3: Добавляем иконку в разметку --- */}
            <div>{Icon}</div>
            
            {/* Основная информация */}
            <div>
              <h3 className="text-lg font-bold text-gray-800 truncate" title={account.name}>
                {account.name}
              </h3>
              <p className="text-sm text-gray-500">
                {ACCOUNT_TYPE_LABELS[account.account_type] || account.account_type}
              </p>
            </div>
          </div>
          
          {/* Кнопки действий */}
          <div className="flex space-x-2">
            <Button variant="icon" onClick={() => onEdit(account)} title="Редактировать">
              <PencilSquareIcon className="h-5 w-5 text-gray-500 hover:text-indigo-600" />
            </Button>
            <Button variant="icon" onClick={() => onDelete(account)} title="Удалить">
              <TrashIcon className="h-5 w-5 text-gray-500 hover:text-red-600" />
            </Button>
          </div>
        </div>

        {/* Баланс */}
        <div className="mt-4 pl-10"> {/* Добавим отступ слева, чтобы баланс был под текстом */}
          <p className={`text-2xl font-semibold tracking-tight ${balanceColor}`}>
            {account.current_balance.toLocaleString('ru-RU', {
              style: 'currency',
              currency: account.currency || 'RUB',
              minimumFractionDigits: 2,
            })}
          </p>
        </div>
      </div>
      
      {!isActive && (
        <div className="bg-gray-100 px-5 py-1 text-xs text-center text-gray-500 font-semibold">
          СЧЕТ НЕАКТИВЕН
        </div>
      )}
    </div>
  );
}

export default AccountCard;