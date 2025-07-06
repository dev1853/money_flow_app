import React, { useState } from 'react';
import Button from './Button'
import {
  PencilSquareIcon,
  TrashIcon,
  FolderIcon,
  DocumentTextIcon,
  ChevronRightIcon,
  ChevronDownIcon,
  PlusCircleIcon,
  PencilIcon,
  EllipsisVerticalIcon
} from '@heroicons/react/24/outline';

// --- Создаем объект для стилей и названий меток ---
const ARTICLE_TYPE_INFO = {
  income: {
    label: 'Доход',
    styles: 'bg-green-100 text-green-800',
  },
  expense: {
    label: 'Расход',
    styles: 'bg-red-100 text-red-800',
  },
};

const ArticleNode = ({ article, level = 0, onEdit, onDelete, onAddSubArticle }) => {
  const hasChildren = article.children && article.children.length > 0;
  const [isOpen, setIsOpen] = useState(true);

  const handleToggleOpen = () => {
    if (hasChildren) setIsOpen(!isOpen);
  };

  const handleEditClick = (e) => { e.stopPropagation(); onEdit(article); };
  const handleDeleteClick = (e) => { e.stopPropagation(); onDelete(article); };
  const handleAddSubArticleClick = (e) => { e.stopPropagation(); onAddSubArticle(article.id); };
  
  const Icon = hasChildren ? FolderIcon : DocumentTextIcon;
  const ToggleIcon = isOpen ? ChevronDownIcon : ChevronRightIcon;
  const typeInfo = ARTICLE_TYPE_INFO[article.article_type];
  return (
    <div>
      <div
        className="flex items-center p-2 rounded-md hover:bg-gray-100 group cursor-pointer"
        onClick={handleToggleOpen}
      >
        <div style={{ paddingLeft: `${level * 24}px` }} className="flex items-center flex-grow truncate">
          {hasChildren ? <ToggleIcon className="h-4 w-4 mr-2 text-gray-400"/> : <div className="w-6 mr-2"></div>}
          <Icon className="h-5 w-5 mr-3 text-gray-500" />
          <span className="text-sm font-medium text-gray-800 truncate" title={article.name}>
            {article.name}
          </span>
          
          {/* --- ИЗМЕНЕНИЕ: Добавляем метку типа (доход/расход) --- */}
          {typeInfo && (
            <span className={`ml-3 text-xs font-medium px-2.5 py-0.5 rounded-full ${typeInfo.styles}`}>
              {typeInfo.label}
            </span>
          )}

        </div>

        <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <Button variant="icon" title="Добавить подстатью" onClick={handleAddSubArticleClick}><PlusCircleIcon className="h-5 w-5 text-gray-500 hover:text-green-600"/></Button>
          <Button variant="icon" title="Редактировать" onClick={handleEditClick}><PencilSquareIcon className="h-5 w-5 text-gray-500 hover:text-indigo-600"/></Button>
          {!hasChildren && <Button variant="icon" title="Удалить" onClick={handleDeleteClick}><TrashIcon className="h-5 w-5 text-gray-500 hover:text-red-600"/></Button>}
        </div>
      </div>

      {hasChildren && isOpen && (
        <div className="border-l-2 border-gray-200 ml-5">
          {article.children.map(child => <ArticleNode key={child.id} article={child} level={level + 1} onEdit={onEdit} onDelete={onDelete} onAddSubArticle={onAddSubArticle} />)}
        </div>
      )}
    </div>
  );
};

export default ArticleNode;