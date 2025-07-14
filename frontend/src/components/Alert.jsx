import React from 'react';
import { CheckCircleIcon, XCircleIcon, InformationCircleIcon, ExclamationTriangleIcon } from '@heroicons/react/24/solid';

const alertStyles = {
  success: {
    icon: CheckCircleIcon,
    // Add dark mode classes for success state
    bg: 'bg-green-50 dark:bg-green-900/40',
    iconColor: 'text-green-500 dark:text-green-400',
    textColor: 'text-green-800 dark:text-green-200',
  },
  error: {
    icon: XCircleIcon,
    // Add dark mode classes for error state
    bg: 'bg-red-50 dark:bg-red-900/40',
    iconColor: 'text-red-500 dark:text-red-400',
    textColor: 'text-red-800 dark:text-red-200',
  },
  info: {
    icon: InformationCircleIcon,
    // Add dark mode classes for info state
    bg: 'bg-blue-50 dark:bg-blue-900/40',
    iconColor: 'text-blue-500 dark:text-blue-400',
    textColor: 'text-blue-800 dark:text-blue-200',
  },
  warning: {
      icon: ExclamationTriangleIcon,
      // Add dark mode classes for warning state
      bg: 'bg-yellow-50 dark:bg-yellow-900/40',
      iconColor: 'text-yellow-500 dark:text-yellow-400',
      textColor: 'text-yellow-800 dark:text-yellow-200',
  }
};

const Alert = ({ type = 'info', children, className = '' }) => {
  const styles = alertStyles[type] || alertStyles.info;
  const { icon: Icon, bg, iconColor, textColor } = styles;

  return (
    <div className={`rounded-md p-4 ${bg} ${className}`}>
      <div className="flex">
        <div className="flex-shrink-0">
          <Icon className={`h-5 w-5 ${iconColor}`} aria-hidden="true" />
        </div>
        <div className="ml-3">
          <p className={`text-sm font-medium ${textColor}`}>{children}</p>
        </div>
      </div>
    </div>
  );
};

export default Alert;