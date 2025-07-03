// frontend/src/components/forms/SegmentedControl.jsx

import React from 'react';
import { clsx } from 'clsx';

/**
 * Улучшенный сегментированный переключатель с иконками и цветами.
 * @param {Array<{value: string, label: string, icon?: React.Node, activeClassName?: string}>} options - Массив опций.
 * @param {string} value - Текущее выбранное значение.
 * @param {function(string): void} onChange - Колбэк при изменении значения.
 */
const SegmentedControl = ({ options, value, onChange }) => {
  return (
    <div className="flex w-full space-x-1 rounded-lg bg-gray-200 p-1">
      {options.map((option) => {
        const isActive = value === option.value;
        return (
          <button
            key={option.value}
            type="button"
            onClick={() => onChange(option.value)}
            className={clsx(
              'w-full rounded-md py-2 text-sm font-medium leading-5 transition-all duration-200 ease-in-out',
              'focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-200 focus:ring-white',
              {
                // Если опция активна, применяем ее кастомный класс или класс по умолчанию
                [option.activeClassName || 'bg-white shadow text-indigo-700']: isActive,
                // Стиль для неактивной кнопки
                'text-gray-700 hover:bg-white/60': !isActive,
              }
            )}
          >
            <div className="flex items-center justify-center">
              {/* Рендерим иконку, если она есть */}
              {option.icon && React.cloneElement(option.icon, { className: 'w-5 h-5 mr-2' })}
              <span>{option.label}</span>
            </div>
          </button>
        );
      })}
    </div>
  );
};

export default SegmentedControl;