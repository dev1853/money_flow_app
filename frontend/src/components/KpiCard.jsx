// frontend/src/components/KpiCard.jsx

import React from 'react';
// ИСПРАВЛЕНО: Импортируем solid версии иконок для единообразия
import { ArrowTrendingUpIcon, ArrowTrendingDownIcon } from '@heroicons/react/24/solid';

const KpiCard = ({
    title,
    value,
    icon: IconComponent, // Иконка для отображения
    iconBgColor = 'bg-gray-100', // Цвет фона для иконки
    iconColor = 'text-gray-600', // Цвет самой иконки
    valueColor = 'text-gray-900', // Цвет основного значения
    description = '', // Опциональное описание под основным значением
    trendPercentage = null, // Опциональный процент изменения (например, '+3.2%')
    trendColorClass = 'text-gray-500', // Цвет текста для процента изменения
    trendIcon: TrendIconComponent = null, // Опциональная иконка тренда (например, стрелка вверх/вниз)
    className = '', // Дополнительные классы для контейнера карточки
}) => {
    return (
        <div className={`relative overflow-hidden rounded-lg bg-white px-4 py-5 shadow transition-shadow duration-300 hover:shadow-lg ${className}`}>
            <dt className="truncate text-sm font-medium text-gray-500" title={title}>
                {title}
            </dt>
            <dd className={`mt-1 text-3xl font-semibold tracking-tight ${valueColor}`}>
                {value}
            </dd>

            {/* Опциональное описание под основным значением */}
            {description && (
                <div className="text-xs text-gray-500 mt-1">
                    {description}
                </div>
            )}

            {/* Процент изменения/тренд, если передан */}
            {trendPercentage !== null && (
                <div className={`absolute bottom-0 left-0 px-4 py-2 text-sm font-medium ${trendColorClass}`}>
                    {TrendIconComponent && <TrendIconComponent className="h-4 w-4 inline mr-1" aria-hidden="true" />}
                    {trendPercentage}
                </div>
            )}
            
            {/* Иконка в нижнем правом углу */}
            {IconComponent && (
                <div className={`absolute bottom-0 right-0 p-3 rounded-tl-lg ${iconBgColor}`}>
                    <IconComponent className={`h-6 w-6 ${iconColor}`} aria-hidden="true" />
                </div>
            )}
        </div>
    );
};

export default KpiCard;