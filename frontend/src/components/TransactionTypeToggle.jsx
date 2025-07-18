import React from 'react';
import { ArrowUpCircleIcon, ArrowDownCircleIcon } from '@heroicons/react/24/solid';
import { ArrowsRightLeftIcon } from '@heroicons/react/24/outline';

const TRANSACTION_TYPES = [
  { value: 'EXPENSE', label: 'Расход', icon: <ArrowDownCircleIcon className="h-5 w-5 mr-2 text-white" /> },
  { value: 'INCOME', label: 'Доход', icon: <ArrowUpCircleIcon className="h-5 w-5 mr-2 text-white" /> },
  { value: 'TRANSFER', label: 'Перевод', icon: <ArrowsRightLeftIcon className="h-5 w-5 mr-2 text-white" /> },
];

const baseClasses =
  'inline-flex items-center justify-center font-semibold rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 transition-all duration-200 ease-in-out transform hover:-translate-y-px active:scale-[0.98] border-transparent';
const activeClasses =
  'bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-lg hover:shadow-xl hover:from-indigo-600 hover:to-purple-700 focus:ring-indigo-500';
const inactiveClasses =
  'bg-gray-200 text-gray-800 hover:bg-gray-300 focus:ring-gray-400 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600 dark:focus:ring-gray-500';

const TransactionTypeToggle = ({ value, onChange, className = '' }) => (
  <div className={`flex rounded-lg p-1 w-full max-w-xs mx-auto mb-4 bg-gray-100 dark:bg-gray-800 ${className}`}>
    {TRANSACTION_TYPES.map((type) => {
      const isActive = value === type.value;
      return (
        <button
          key={type.value}
          type="button"
          onClick={() => onChange({ target: { name: 'transaction_type', value: type.value } })}
          className={
            baseClasses +
            ' flex-1 px-4 py-2 m-0.5 text-sm ' +
            (isActive ? activeClasses : inactiveClasses)
          }
          style={{ minWidth: 0 }}
        >
          {type.icon}
          {type.label}
        </button>
      );
    })}
  </div>
);

export default TransactionTypeToggle; 