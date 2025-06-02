// frontend/src/components/ArticleNode.jsx
import React, { useState } from 'react';
import {
  PencilIcon, //
  ArchiveBoxArrowDownIcon, //
  TrashIcon, //
  InboxArrowDownIcon, //
  FolderIcon, //
  DocumentTextIcon, //
  ChevronRightIcon, //
  ChevronDownIcon //
} from '@heroicons/react/24/outline'; //
import Button from './Button'; // Импортируем наш компонент Button

const ArticleNode = ({ article, level = 0, onEdit, onArchive, onDelete }) => {
  const hasChildren = article.children && article.children.length > 0; //
  const [isOpen, setIsOpen] = useState(true); //

  const handleToggleOpen = (e) => { //
    // Проверяем, был ли клик на самой кнопке Button или на элементе с ролью button внутри нее
    if (e.target.closest('button, [role="button"]')) {
        // Если клик был на кнопке (или элементе с ролью кнопки),
        // и эта кнопка является одной из кнопок действий (имеет title), то не меняем состояние isOpen.
        // Это предотвращает закрытие/открытие узла при клике на кнопки редактирования/архивации/удаления.
        // Дополнительно проверяем, что это не основной div, которому мы присвоили role="button"
        if (e.target.closest('[title]')) { // Предполагаем, что у кнопок действий есть title
             return;
        }
    }
    if (hasChildren) setIsOpen(!isOpen);
  };


  let NodeIconComponent = hasChildren ? FolderIcon : DocumentTextIcon; //
  const paddingLeft = level * 16; //

  return (
    <div className="py-0.5 first:pt-0 last:pb-0" style={{ paddingLeft: `${paddingLeft}px` }}> {/* */}
      <div
        className={`flex items-center p-2 pr-1 rounded group hover:bg-gray-100 transition-colors duration-150 ${article.is_archived ? 'bg-gray-100 opacity-60' : 'bg-white shadow-sm'}`} //
        onClick={handleToggleOpen}
        // role и tabIndex для доступности раскрывающихся элементов
        role={hasChildren ? "button" : undefined} // listitem не совсем подходит, если нет дочерних, но div не имеет роли по умолчанию
        aria-expanded={hasChildren ? isOpen : undefined}
        tabIndex={hasChildren ? 0 : undefined} //
        onKeyDown={hasChildren ? (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handleToggleOpen(e); }} : undefined} //
      >
        <div className="flex items-center flex-shrink-0 mr-1.5"> {/* */}
          {hasChildren ? ( //
            isOpen ? <ChevronDownIcon className="h-4 w-4 text-gray-500" /> : <ChevronRightIcon className="h-4 w-4 text-gray-500" /> //
          ) : (
            <span className="w-4 h-4 inline-block"></span> //
          )}
          <NodeIconComponent
            className={`h-5 w-5 shrink-0 ml-1 ${article.is_archived ? 'text-gray-400' : (hasChildren ? 'text-yellow-500' : 'text-blue-500')}`} //
            aria-hidden="true"
          />
        </div>

        <div className="flex-grow min-w-0 mr-1 sm:mr-2"> {/* */}
          <span className={`font-medium text-sm truncate ${article.is_archived ? 'text-gray-500 line-through' : 'text-gray-800'}`} title={article.name}> {/* */}
            {article.name} {/* */}
          </span>
          <span
            className={`ml-1 sm:ml-2 text-xs font-medium px-1.5 py-0.5 rounded-full ${ //
              article.is_archived ? 'bg-gray-200 text-gray-500' //
              : article.article_type === 'income' ? 'bg-green-100 text-green-700' //
              : 'bg-orange-100 text-orange-700' //
            }`}
          >
            {article.article_type === 'income' ? 'Доход' : 'Расход'} {/* */}
          </span>
        </div>

        <div className="flex-shrink-0 flex items-center space-x-0.5"> {/* */}
          <span className="text-xs text-gray-400 font-mono hidden md:inline mr-1"> {/* */}
            ID:{article.id} {/* */}
          </span>
          <Button
            variant="icon"
            size="sm" // p-1.5 для icon variant + sm size
            onClick={(e) => { e.stopPropagation(); onEdit(article); }} //
            title="Редактировать"
            className="text-gray-500 hover:text-blue-600 focus:ring-blue-500" //
          >
            <PencilIcon className="h-4 w-4" /> {/* */}
          </Button>
          <Button
            variant="icon"
            size="sm"
            onClick={(e) => { e.stopPropagation(); onArchive(article); }} //
            title={article.is_archived ? "Разархивировать" : "Архивировать"} //
            className={article.is_archived ? 'text-yellow-500 hover:text-yellow-700 focus:ring-yellow-500' : 'text-gray-500 hover:text-green-600 focus:ring-green-500'} //
          >
            {article.is_archived ? <InboxArrowDownIcon className="h-4 w-4" /> : <ArchiveBoxArrowDownIcon className="h-4 w-4" />} {/* */}
          </Button>
          {!hasChildren && ( //
             <Button
                variant="icon"
                size="sm"
                onClick={(e) => { e.stopPropagation(); onDelete(article); }} //
                title="Удалить"
                className="text-gray-500 hover:text-red-600 focus:ring-red-500" //
             >
                <TrashIcon className="h-4 w-4" /> {/* */}
            </Button>
          )}
        </div>
      </div>

      {hasChildren && isOpen && ( //
        <div className="mt-0.5"> {/* */}
          {article.children.map(child => ( //
            <ArticleNode
                key={child.id} article={child} level={level + 1} //
                onEdit={onEdit} onArchive={onArchive} onDelete={onDelete} //
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default ArticleNode; //