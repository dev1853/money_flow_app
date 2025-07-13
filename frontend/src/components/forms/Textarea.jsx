// frontend/src/components/forms/Textarea.jsx
import React from 'react';
import Label from './Label'; // Импортируем компонент Label

const Textarea = ({ label, id, name, value, onChange, rows = 3, className = '', ...props }) => {
    const textareaId = id || name; // Используем переданный id или имя для связки с лейблом
    // Обновленные базовые классы для Textarea:
    // - py-2.5 для унификации высоты (влияет на отступ внутри)
    // - border-gray-300 для видимой границы (как на скриншоте)
    // - удалены ring-1 и focus:ring-2
    const baseClasses = "mt-1 pl-2 block w-full rounded-md border border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm py-2.5";

    return (
        <div>
            {label && <Label htmlFor={textareaId}>{label}</Label>} {/* Рендерим Label, если он есть */}
            <textarea
                id={textareaId} // Связываем textarea с label через id
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