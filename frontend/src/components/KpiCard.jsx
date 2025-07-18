import React from 'react';
import PropTypes from 'prop-types';
import CountUp from 'react-countup';

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
  shadowColorClass,
}) => {
  return (
    <div className={`relative overflow-hidden rounded-lg bg-white dark:bg-gray-800 p-5 shadow-md border border-gray-200 dark:border-gray-700 transition-shadow duration-300 hover:shadow-lg ${shadowColorClass} animate-fade-in-up`}>
      <div className="flex items-center">
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
                {typeof value === 'number' ? (
                  <CountUp end={value} duration={1.2} separator=" " decimals={2} />
                ) : value}
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

KpiCard.propTypes = {
  title: PropTypes.string.isRequired,
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
  icon: PropTypes.elementType,
  iconBgColor: PropTypes.string,
  iconColor: PropTypes.string,
  valueColor: PropTypes.string,
  trendPercentage: PropTypes.string,
  trendColorClass: PropTypes.string,
  trendIcon: PropTypes.elementType,
  shadowColorClass: PropTypes.string,
};

KpiCard.defaultProps = {
  icon: null,
  trendIcon: null,
  iconBgColor: 'bg-gray-100',
  iconColor: 'text-gray-600',
  valueColor: 'text-gray-900 dark:text-gray-100',
  trendPercentage: '',
  trendColorClass: 'text-gray-500',
  shadowColorClass: '',
};

export default KpiCard;