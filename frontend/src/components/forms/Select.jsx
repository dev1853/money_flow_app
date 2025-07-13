// frontend/src/components/forms/Select.jsx
import React from 'react';
import Label from './Label'; 

const Select = ({ label, id, name, value, onChange, children, className = '', options = [], ...props }) => { // Добавили options = []
    const selectId = id || name; 
    const baseClasses = "mt-1 block w-full rounded-md border border-gray-300 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 sm:text-sm py-2.5 pl-3 pr-10";

    return (
        <div>
            {label && <Label htmlFor={selectId}>{label}</Label>} 
            <select
                id={selectId}
                name={name}
                value={value}
                onChange={onChange}
                className={`${baseClasses} ${className}`}
                {...props}
            >
                {options.map(option => ( // ИСПРАВЛЕНИЕ: Итерируем по options и рендерим <option>
                    <option key={option.value} value={option.value}>
                        {option.label}
                    </option>
                ))}
                {children} {/* Оставляем children на случай, если они используются */}
            </select>
        </div>
    );
};

export default Select;