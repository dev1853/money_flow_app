// frontend/src/components/Alert.jsx
import React from 'react';
import {
  ExclamationTriangleIcon,
  CheckCircleIcon,
  InformationCircleIcon,
  XCircleIcon
} from '@heroicons/react/24/solid';

const Alert = ({
  type = 'info',
  title,
  message,
  onClose,
  className = '',
}) => {
  let bgColor = 'bg-blue-50';
  let borderColor = 'border-blue-400';
  let titleColor = 'text-blue-800';
  let messageColor = 'text-blue-700';
  let IconComponent = InformationCircleIcon;
  let iconColor = 'text-blue-400';
  let closeButtonFocusRingColor = 'focus:ring-blue-500';

  switch (type) {
    case 'success':
      bgColor = 'bg-green-50';
      borderColor = 'border-green-400';
      titleColor = 'text-green-800';
      messageColor = 'text-green-700';
      IconComponent = CheckCircleIcon;
      iconColor = 'text-green-400';
      closeButtonFocusRingColor = 'focus:ring-green-500';
      break;
    case 'warning':
      bgColor = 'bg-yellow-50';
      borderColor = 'border-yellow-400';
      titleColor = 'text-yellow-800';
      messageColor = 'text-yellow-700';
      IconComponent = ExclamationTriangleIcon;
      iconColor = 'text-yellow-400';
      closeButtonFocusRingColor = 'focus:ring-yellow-500';
      break;
    case 'error':
      bgColor = 'bg-red-50';
      borderColor = 'border-red-400';
      titleColor = 'text-red-800';
      messageColor = 'text-red-700';
      IconComponent = ExclamationTriangleIcon;
      iconColor = 'text-red-400';
      closeButtonFocusRingColor = 'focus:ring-red-500';
      break;
    default: // info
      break;
  }

  if (!message && !title) {
    return null;
  }

  return (
    <div className={`rounded-md ${bgColor} p-4 border-l-4 ${borderColor} shadow-sm ${className}`}>
      <div className="flex">
        <div className="flex-shrink-0">
          <IconComponent className={`h-5 w-5 ${iconColor}`} aria-hidden="true" />
        </div>
        <div className="ml-3 flex-1">
          {title && <h3 className={`text-sm font-medium ${titleColor}`}>{title}</h3>}
          {message && (
            <div className={`text-sm ${messageColor} ${title ? 'mt-1' : ''}`}>
              {typeof message === 'string' ? <p>{message}</p> : message}
            </div>
          )}
        </div>
        {onClose && (
          <div className="ml-auto pl-3">
            <div className="-mx-1.5 -my-1.5">
              <button
                type="button"
                onClick={onClose}
                className={`inline-flex rounded-md p-1.5 ${iconColor} hover:opacity-75
                           focus:outline-none focus:ring-2 focus:ring-offset-2
                           focus:ring-offset-${bgColor.split('-')[0]}-50 ${closeButtonFocusRingColor}`}
                aria-label="Закрыть"
              >
                <span className="sr-only">Закрыть</span>
                <XCircleIcon className="h-5 w-5" aria-hidden="true" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Alert;