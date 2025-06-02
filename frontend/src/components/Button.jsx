// frontend/src/components/Button.jsx
import React from 'react';

const Button = ({
  children,
  onClick,
  type = 'button',
  variant = 'primary',
  size = 'md',
  disabled = false,
  iconLeft,
  iconRight,
  className = '',
  fullWidth = false,
  title,
  ...props
}) => {
  let baseClasses = "inline-flex items-center justify-center font-medium rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 transition-colors duration-150 ease-in-out";
  let variantClasses = '';

  switch (variant) {
    case 'primary':
      variantClasses = 'text-white bg-indigo-600 hover:bg-indigo-700 focus:ring-indigo-500';
      break;
    case 'secondary':
      variantClasses = 'text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 focus:ring-indigo-500';
      break;
    case 'danger':
      variantClasses = 'text-white bg-red-600 hover:bg-red-700 focus:ring-red-500';
      break;
    case 'success':
      variantClasses = 'text-white bg-green-600 hover:bg-green-700 focus:ring-green-500';
      break;
    case 'link':
      variantClasses = 'text-indigo-600 hover:text-indigo-800 focus:ring-indigo-500 underline';
      baseClasses = baseClasses.replace(' shadow-sm', '');
      break;
    case 'icon':
      variantClasses = 'text-gray-500 hover:text-gray-700 focus:ring-indigo-500';
      baseClasses = baseClasses.replace(' shadow-sm', '');
      break;
    default:
      variantClasses = 'text-white bg-indigo-600 hover:bg-indigo-700 focus:ring-indigo-500';
  }

  let sizeClasses = '';
  switch (size) {
    case 'sm':
      sizeClasses = variant === 'icon' ? 'p-1.5' : 'px-3 py-1.5 text-xs';
      break;
    case 'md':
      sizeClasses = variant === 'icon' ? 'p-2' : 'px-4 py-2 text-sm';
      break;
    case 'lg':
      sizeClasses = variant === 'icon' ? 'p-2.5' : 'px-6 py-3 text-base';
      break;
    default:
      sizeClasses = variant === 'icon' ? 'p-2' : 'px-4 py-2 text-sm';
  }

  if (variant === 'icon' && children) {
    switch (size) {
        case 'sm': sizeClasses = 'px-2 py-1.5 text-xs'; break;
        case 'lg': sizeClasses = 'px-5 py-2.5 text-base'; break;
        default: sizeClasses = 'px-3.5 py-2 text-sm'; break;
    }
  }

  const iconMarginClass = children && variant !== 'icon' ? (size === 'sm' ? 'mr-1' : 'mr-1.5') : '';
  const iconMarginClassRight = children && variant !== 'icon' ? (size === 'sm' ? 'ml-1' : 'ml-1.5') : '';

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={`
        ${baseClasses}
        ${variantClasses}
        ${sizeClasses}
        ${fullWidth ? 'w-full' : ''}
        ${disabled ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'}
        ${className}
      `}
      {...props}
    >
      {iconLeft && <span className={`inline-flex items-center ${iconMarginClass}`}>{iconLeft}</span>}
      {children}
      {iconRight && <span className={`inline-flex items-center ${iconMarginClassRight}`}>{iconRight}</span>}
    </button>
  );
};

export default Button;