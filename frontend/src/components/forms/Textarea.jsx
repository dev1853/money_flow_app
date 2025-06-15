// frontend/src/components/forms/Textarea.jsx
import React from 'react';

const Textarea = ({ id, name, value, onChange, rows = 3, className = '', ...props }) => {
    // Обновленные базовые классы для Textarea:
    // - py-2.5 для унификации высоты (влияет на отступ внутри)
    // - border-gray-300 для видимой границы (как на скриншоте)
    // - удалены ring-1 и focus:ring-2
    const baseClasses = "mt-1 pl-2 block w-full rounded-md border border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm py-2.5";

    return (
        <textarea
            id={id}
            name={name}
            value={value}
            onChange={onChange}
            rows={rows}
            className={`${baseClasses} ${className}`}
            {...props}
        />
    );
};

export default Textarea;