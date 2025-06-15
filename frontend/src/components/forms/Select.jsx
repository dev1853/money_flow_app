// frontend/src/components/forms/Select.jsx
import React from 'react';

const Select = ({ id, name, value, onChange, children, className = '', ...props }) => {
    // Обновленные базовые классы для Select, чтобы соответствовать Input и Textarea:
    // - py-2.5 для унификации высоты
    // - border-gray-300 для видимой границы (как на скриншоте)
    // - удалены ring-1 и focus:ring-2, так как border-0 с ring теперь заменены на обычный border
    const baseClasses = "mt-1 block w-full rounded-md border border-gray-300 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 sm:text-sm py-2.5 pl-3 pr-10"; // pl-3 pr-10 для Select специфичны

    return (
        <select
            id={id}
            name={name}
            value={value}
            onChange={onChange}
            className={`${baseClasses} ${className}`}
            {...props}
        >
            {children}
        </select>
    );
};

export default Select;