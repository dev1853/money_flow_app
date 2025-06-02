// frontend/src/components/KpiCard.jsx
import React from 'react';

const KpiCard = ({
  title,
  value,
  icon: IconComponent,
  iconBgColor = 'bg-gray-100',
  iconColor = 'text-gray-600',
  valueColor = 'text-gray-900',
  className = '',
  gridSpanClasses = 'lg:col-span-3 md:col-span-6 col-span-12'
}) => {
  return (
    <div className={`${gridSpanClasses} rounded-lg bg-white p-5 shadow-md hover:shadow-lg transition-shadow ${className}`}>
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-gray-500 truncate" title={title}>
          {title}
        </p>
        {IconComponent && (
          <div className={`flex h-10 w-10 items-center justify-center rounded-full ${iconBgColor}`}>
            <IconComponent className={`h-6 w-6 ${iconColor}`} aria-hidden="true" />
          </div>
        )}
      </div>
      <div className="mt-2">
        <p className={`text-3xl font-semibold ${valueColor}`}>
          {value}
        </p>
      </div>
    </div>
  );
};

export default KpiCard;