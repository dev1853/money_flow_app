import React from 'react';

const EmptyState = ({
  icon: Icon,
  title,
  message,
  actionButton,
  className = '',
}) => {
  return (
    // 1. Adapt the main container for dark mode
    <div className={`text-center py-12 sm:py-16 bg-white dark:bg-gray-800/50 shadow-lg dark:shadow-2xl dark:shadow-indigo-500/10 rounded-xl border border-gray-200 dark:border-gray-700/50 ${className}`}>
      {Icon && (
        // 2. Adapt the icon color
        <div className="mx-auto h-12 w-12 flex items-center justify-center text-gray-400 dark:text-gray-500">
          {React.isValidElement(Icon) ? Icon : <Icon className="h-12 w-12" aria-hidden="true" />}
        </div>
      )}
      {title && (
        // 3. Adapt the title text color
        <h3 className="mt-2 text-lg font-semibold text-gray-900 dark:text-gray-100">{title}</h3>
      )}
      {message && (
        // 4. Adapt the message text color
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          {message}
        </p>
      )}
      {actionButton && (
        <div className="mt-6">
          {actionButton}
        </div>
      )}
    </div>
  );
};

export default EmptyState;