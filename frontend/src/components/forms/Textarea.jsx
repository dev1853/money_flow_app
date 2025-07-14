// frontend/src/components/forms/Textarea.jsx
import React from 'react';
import Label from './Label'; // Label уже адаптирован

const Textarea = ({ label, id, name, value, onChange, rows = 3, className = '', ...props }) => {
    const textareaId = id || name;

    // 1. Добавляем классы для темной темы
    const baseClasses = "mt-1 pl-2 block w-full rounded-md border shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm py-2.5 " +
                        "bg-white dark:bg-gray-700 " +
                        "text-gray-900 dark:text-gray-200 " +
                        "border-gray-300 dark:border-gray-600 " +
                        "placeholder-gray-400 dark:placeholder-gray-500 " +
                        "focus:ring-offset-2 dark:focus:ring-offset-gray-800";

    return (
        <div>
            {label && <Label htmlFor={textareaId}>{label}</Label>}
            <textarea
                id={textareaId}
                name={name}
                value={value}
                onChange={onChange}
                rows={rows}
                className={`${baseClasses} ${className}`}
                {...props}
            />
        </div>
    );
};

export default Textarea;