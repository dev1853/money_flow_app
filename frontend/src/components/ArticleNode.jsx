import React, { useState, Fragment } from 'react';
import { Menu, Transition } from '@headlessui/react';
import {
  FolderIcon,
  DocumentTextIcon,
  ChevronRightIcon,
  ChevronDownIcon,
  PlusCircleIcon,
  PencilIcon,
  TrashIcon,
  EllipsisVerticalIcon
} from '@heroicons/react/24/outline';

const ARTICLE_TYPE_INFO = {
  income: { label: 'Доход', styles: 'bg-green-100 text-green-800' },
  expense: { label: 'Расход', styles: 'bg-red-100 text-red-800' },
};

function ArticleNode({ article, level = 0, onEdit, onDelete, onAddSubArticle }) {
  const hasChildren = article.children && article.children.length > 0;
  const [isOpen, setIsOpen] = useState(true);
  
  const Icon = hasChildren ? FolderIcon : DocumentTextIcon;
  const ToggleIcon = isOpen ? ChevronDownIcon : ChevronRightIcon;
  const typeInfo = ARTICLE_TYPE_INFO[article.type];

  return (
    <div className="relative">
      {level > 0 && <span className="absolute left-3 h-full border-l-2 border-gray-200" style={{top: '-12px', zIndex: 0}}></span>}
      <div className="flex items-center w-full p-2 rounded-md hover:bg-gray-100 group relative">
        <div style={{ paddingLeft: `${level * 28}px` }} className="flex items-center flex-grow truncate">
           {level > 0 && <span className="absolute h-[2px] w-4 bg-gray-200" style={{left: `${level * 28 - 16}px`}}></span>}
          <div className="flex items-center cursor-pointer" onClick={() => hasChildren && setIsOpen(!isOpen)}>
            {hasChildren ? <ToggleIcon className="h-4 w-4 mr-1 text-gray-500"/> : <div className="w-5 mr-1"></div>}
            <Icon className="h-5 w-5 mr-2 text-gray-600 flex-shrink-0" />
            <span className="text-sm font-medium text-gray-900 truncate" title={article.name}>{article.name}</span>
          </div>
          {typeInfo && <span className={`ml-3 text-xs font-medium px-2.5 py-0.5 rounded-full ${typeInfo.styles}`}>{typeInfo.label}</span>}
        </div>

        <Menu as="div" className="relative flex-shrink-0">
          <Menu.Button className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded-full text-gray-500 hover:bg-gray-200">
            <EllipsisVerticalIcon className="h-5 w-5" />
          </Menu.Button>
          <Transition as={Fragment} enter="transition ease-out duration-100" enterFrom="transform opacity-0 scale-95" enterTo="transform opacity-100 scale-100" leave="transition ease-in duration-75" leaveFrom="transform opacity-100 scale-100" leaveTo="transform opacity-0 scale-95">
            <Menu.Items className="origin-top-right absolute right-0 mt-2 w-56 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 focus:outline-none z-10">
              <div className="px-1 py-1">
                <Menu.Item>
                  {({ active }) => (<button onClick={() => onAddSubArticle(article.id)} className={`${active ? 'bg-gray-100' : ''} group flex w-full items-center rounded-md px-2 py-2 text-sm text-gray-900`}><PlusCircleIcon className="mr-2 h-5 w-5 text-green-500" /> Добавить подстатью</button>)}
                </Menu.Item>
                <Menu.Item>
                  {({ active }) => (<button onClick={() => onEdit(article)} className={`${active ? 'bg-gray-100' : ''} group flex w-full items-center rounded-md px-2 py-2 text-sm text-gray-900`}><PencilIcon className="mr-2 h-5 w-5 text-indigo-500" /> Редактировать</button>)}
                </Menu.Item>
              </div>
              <div className="px-1 py-1">
                {!hasChildren && (<Menu.Item>{({ active }) => (<button onClick={() => onDelete(article)} className={`${active ? 'bg-red-100 text-red-900' : 'text-gray-900'} group flex w-full items-center rounded-md px-2 py-2 text-sm`}><TrashIcon className="mr-2 h-5 w-5 text-red-500" /> Удалить</button>)}</Menu.Item>)}
              </div>
            </Menu.Items>
          </Transition>
        </Menu>
      </div>

      {hasChildren && isOpen && (<div>{article.children.map(child => <ArticleNode key={child.id} article={child} level={level + 1} onEdit={onEdit} onDelete={onDelete} onAddSubArticle={onAddSubArticle} />)}</div>)}
    </div>
  );
};
export default ArticleNode;