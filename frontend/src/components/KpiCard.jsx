import React from 'react';

// Этот компонент уже получает цвета как props,
// поэтому основные изменения были в DashboardPage.
// Здесь мы адаптируем только базовые цвета текста и фона самой карточки.

const KpiCard = ({
  title,
  value,
  icon: Icon,
  iconBgColor,
  iconColor,
  valueColor,
  trendPercentage,
  trendColorClass,
  trendIcon: TrendIcon,
}) => {
  return (
    // Адаптируем фон, границу и тень карточки
    <div className="relative overflow-hidden rounded-lg bg-white dark:bg-gray-800 p-5 shadow-sm border border-gray-200 dark:border-gray-700">
      <div className="flex items-center">
        <div className={`rounded-full p-3 ${iconBgColor}`}>
          <Icon className={`h-6 w-6 ${iconColor}`} aria-hidden="true" />
        </div>
        <div className="ml-5 w-0 flex-1">
          <dl>
            {/* Адаптируем цвет заголовка */}
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
      {trendPercentage && (
        <div className="mt-2 flex items-baseline">
          <p className={`flex items-baseline text-sm font-semibold ${trendColorClass}`}>
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

export default KpiCard;