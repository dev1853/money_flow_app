// frontend/src/components/EmptyState.jsx
import React from 'react';

const EmptyState = ({
  icon: Icon,
  title,
  message,
  actionButton,
  className = '',
}) => {
  return (
    <div className={`text-center py-12 sm:py-16 bg-white shadow-lg rounded-xl ${className}`}>
      {Icon && (
        typeof Icon === 'function' || (typeof Icon === 'object' && Icon.displayName) ? (
          <Icon className="mx-auto h-12 w-12 text-gray-400" aria-hidden="true" />
        ) : (
          React.isValidElement(Icon) ? <div className="mx-auto h-12 w-12 flex items-center justify-center text-gray-400">{Icon}</div> : null
        )
      )}
      {title && (
        <h3 className="mt-2 text-lg font-semibold text-gray-900">{title}</h3>
      )}
      {message && (
        <p className="mt-1 text-sm text-gray-500">
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