// frontend/src/components/forms/Input.jsx

import React from 'react';
import Label from './Label'; // Импортируем компонент Label

const Input = React.forwardRef(({ label, id, type = 'text', className, ...props }, ref) => {
  const inputId = id || props.name; // Используем переданный id или имя для связки с лейблом
  // ИСПРАВЛЕНО: Изменено py-2 на py-2.5 для унификации высоты
  const baseStyles = "mt-1 relative block w-full appearance-none rounded-md border border-gray-300 px-3 py-2.5 text-gray-900 placeholder-gray-500 focus:z-10 focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 sm:text-sm";
  
  return (
    <div>
      {label && <Label htmlFor={inputId}>{label}</Label>} {/* Рендерим Label, если он есть */}
      <input
        id={inputId} // Связываем input с label через id
        type={type}
        className={`${baseStyles} ${className}`}
        ref={ref}
        {...props}
      />
    </div>
  );
});

export default Input;