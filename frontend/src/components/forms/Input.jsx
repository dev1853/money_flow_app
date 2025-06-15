// frontend/src/components/forms/Input.jsx
import React from 'react';

const Input = ({ type = 'text', id, name, value, onChange, className = '', ...props }) => {
  // Обновленные базовые классы для Input:
  // - py-2.5 для унификации высоты
  // - border-gray-300 для видимой границы (как на скриншоте)
  // - удалены ring-1 и focus:ring-2, так как border-0 с ring теперь заменены на обычный border
  const baseClasses = "mt-1 pl-2 block w-full rounded-md border border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm py-2.5";
  
  return (
    <input
      type={type}
      id={id}
      name={name}
      value={value}
      onChange={onChange}
      className={`${baseClasses} ${className}`}
      {...props}
    />
  );
};

export default Input;