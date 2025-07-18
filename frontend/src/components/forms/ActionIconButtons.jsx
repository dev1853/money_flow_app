import React from 'react';
import Button from '../Button';
import { PencilSquareIcon, TrashIcon } from '@heroicons/react/24/solid';

const ActionIconButtons = ({
  onEdit,
  onDelete,
  editTitle = 'Редактировать',
  deleteTitle = 'Удалить',
  editAriaLabel = 'Редактировать',
  deleteAriaLabel = 'Удалить',
  size = 'sm',
  className = '',
}) => (
  <div className={`flex space-x-2 ${className}`}>
    <Button
      variant="icon"
      size={size}
      onClick={onEdit}
      title={editTitle}
      aria-label={editAriaLabel}
    >
      <PencilSquareIcon className="h-5 w-5 text-gray-500 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-500" />
    </Button>
    <Button
      variant="icon"
      size={size}
      onClick={onDelete}
      title={deleteTitle}
      aria-label={deleteAriaLabel}
      className="text-red-500 hover:text-red-700 dark:text-red-500 dark:hover:text-red-400"
    >
      <TrashIcon className="h-5 w-5" />
    </Button>
  </div>
);

export default ActionIconButtons; 