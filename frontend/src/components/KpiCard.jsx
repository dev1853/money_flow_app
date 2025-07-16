import React from 'react';
import PropTypes from 'prop-types'; // Импортируем PropTypes

const KpiCard = ({
  title,
  value,
  icon: Icon,          // Переименовываем prop 'icon' в 'Icon'
  iconBgColor,
  iconColor,
  valueColor,
  trendPercentage,
  trendColorClass,
  trendIcon: TrendIcon, // Переименовываем prop 'trendIcon' в 'TrendIcon'
}) => {
  return (
    <div className="relative overflow-hidden rounded-lg bg-white dark:bg-gray-800 p-5 shadow-sm border border-gray-200 dark:border-gray-700">
      <div className="flex items-center">
        
        {/* ИСПРАВЛЕНИЕ 1: Проверяем, что Icon существует перед рендерингом */}
        {Icon && (
          <div className={`rounded-full p-3 ${iconBgColor}`}>
            <Icon className={`h-6 w-6 ${iconColor}`} aria-hidden="true" />
          </div>
        )}

        <div className="ml-5 w-0 flex-1">
          <dl>
            <dt className="truncate text-sm font-medium text-gray-500 dark:text-gray-400">
              {title}
            </dt>
            <dd>
              <div className={`text-lg font-bold ${valueColor}`}>
                {value}
              </div>
            </dd>
          </dl>
        </div>
      </div>

      {/* Проверяем наличие trendPercentage для отображения блока */}
      {trendPercentage && (
        <div className="mt-2 flex items-baseline">
          <p className={`flex items-baseline text-sm font-semibold ${trendColorClass}`}>
            
            {/* ИСПРАВЛЕНИЕ 2: Проверяем, что TrendIcon существует */}
            {TrendIcon && (
              <TrendIcon
                className="mr-1.5 h-4 w-4 flex-shrink-0 self-center"
                aria-hidden="true"
              />
            )}
            {trendPercentage}
          </p>
        </div>
      )}
    </div>
  );
};

// ИСПРАВЛЕНИЕ 3: Добавляем PropTypes для валидации props
KpiCard.propTypes = {
  title: PropTypes.string.isRequired,
  value: PropTypes.string.isRequired,
  icon: PropTypes.elementType, // Ожидаем компонент (или функцию)
  iconBgColor: PropTypes.string,
  iconColor: PropTypes.string,
  valueColor: PropTypes.string,
  trendPercentage: PropTypes.string,
  trendColorClass: PropTypes.string,
  trendIcon: PropTypes.elementType, // Ожидаем компонент (или функцию)
};

// Добавляем значения по умолчанию для необязательных props
KpiCard.defaultProps = {
  icon: null,
  trendIcon: null,
  iconBgColor: 'bg-gray-100',
  iconColor: 'text-gray-600',
  valueColor: 'text-gray-900 dark:text-gray-100',
  trendPercentage: '',
  trendColorClass: 'text-gray-500',
};

export default KpiCard;