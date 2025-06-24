// frontend/src/components/PageTitle.jsx
import React from 'react';

const PageTitle = ({
  title,
  icon: IconComponent,
  actions,
  className = '', // className для внешнего div
  titleClassName = 'text-2xl md:text-3xl font-bold text-gray-900 leading-tight', // Классы для самого h1
}) => {
  return (
    // ИЗМЕНЕНО: Удален жесткий mb-6. Теперь отступ управляется извне через 'className'.
    // flex-wrap добавлен для адаптивности заголовка и кнопок
    <div
      className={`flex flex-col sm:flex-row sm:justify-between sm:items-center gap-y-3 gap-x-4 ${className}`} // <--- ИСПРАВЛЕНО ЗДЕСЬ!
    >
      <div className="flex items-center min-w-0 flex-auto"> {/* <--- Добавлен flex-auto */}
        {IconComponent && (
          React.isValidElement(IconComponent) ? (
            <span className="mr-3 flex-shrink-0">{IconComponent}</span>
          ) : typeof IconComponent === 'function' || (typeof IconComponent === 'object' && IconComponent.displayName) ? (
            <IconComponent
              className="h-7 w-7 md:h-8 md:w-8 text-indigo-600 mr-2 sm:mr-3 flex-shrink-0"
              aria-hidden="true"
            />
          ) : null
        )}
        <h1 className={`${titleClassName} truncate min-w-0`}> {/* <--- Добавлен min-w-0 к h1 */}
          {title}
        </h1>
      </div>
      {actions && (
        <div className="flex-shrink-0 flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3 w-full sm:w-auto">
          {actions}
        </div>
      )}
    </div>
  );
};

export default PageTitle;