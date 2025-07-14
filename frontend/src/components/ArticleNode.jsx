import React, { useState } from 'react';
import Button from './Button';
import {
  PencilSquareIcon,
  TrashIcon,
  FolderIcon,
  DocumentTextIcon,
  ChevronRightIcon,
  ChevronDownIcon,
  PlusCircleIcon,
} from '@heroicons/react/24/solid';

// 1. Add dark mode classes to the type info object
const ARTICLE_TYPE_INFO = {
  income: {
    label: 'Доход',
    styles: 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-200',
  },
  expense: {
    label: 'Расход',
    styles: 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-200',
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
    <div className={`flex flex-col ${level > 0 ? 'ml-4 mt-1' : ''}`}>
      <div 
        // 2. Adapt the hover background color
        className={`flex items-center justify-between p-2 rounded-md transition-colors duration-200 ${
          hasChildren ? 'cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700/50' : ''
        } group`}
        onClick={handleToggleOpen}
      >
        <div className="flex items-center">
          {hasChildren ? (
            // 3. Adapt icon colors
            <ToggleIcon className="h-5 w-5 mr-1 text-gray-500 dark:text-gray-400" />
          ) : (
            <div className="w-5 mr-1"></div> // Keep alignment consistent
          )}
          <Icon className="h-5 w-5 mr-3 text-gray-500 dark:text-gray-400" />
          {/* 4. Adapt article name text color */}
          <span className="text-sm font-medium text-gray-800 dark:text-gray-200 truncate" title={article.name}>
            {article.name}
          </span>
          
          {typeInfo && (
            // The type info styles are now adapted via the object above
            <span className={`ml-3 text-xs font-medium px-2.5 py-0.5 rounded-full ${typeInfo.styles}`}>
              {typeInfo.label}
            </span>
          )}
        </div>

        <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
          {/* 5. Adapt action icon colors */}
          <Button variant="icon" title="Добавить подстатью" onClick={handleAddSubArticleClick}>
            <PlusCircleIcon className="h-5 w-5 text-gray-500 dark:text-gray-400 hover:text-green-600 dark:hover:text-green-500"/>
          </Button>
          <Button variant="icon" title="Редактировать" onClick={handleEditClick}>
            <PencilSquareIcon className="h-5 w-5 text-gray-500 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-500"/>
          </Button>
          {!hasChildren && 
            <Button variant="icon" title="Удалить" onClick={handleDeleteClick}>
              <TrashIcon className="h-5 w-5 text-gray-500 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-500"/>
            </Button>
          }
        </div>
      </div>

      {hasChildren && isOpen && (
        // 6. Adapt the indentation border color
        <div className="border-l-2 border-gray-200 dark:border-gray-700 ml-3 pl-3">
          {article.children.map(child => (
            <ArticleNode 
              key={child.id} 
              article={child} 
              level={level + 1} 
              onEdit={onEdit} 
              onDelete={onDelete} 
              onAddSubArticle={onAddSubArticle}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default ArticleNode;