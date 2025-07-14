import React from 'react';
import Button from './Button';
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/20/solid';

const Pagination = ({
  currentPage,
  totalPages,
  onPageChange,
  itemsPerPage,
  totalItems,
}) => {
  if (totalPages <= 1) {
    return null;
  }

  const handlePageClick = (pageNumber) => {
    if (pageNumber >= 1 && pageNumber <= totalPages && pageNumber !== currentPage) {
      onPageChange(pageNumber);
    }
  };

  const pageNumbers = [];
  const maxPagesToShow = 3;
  // 1. Адаптируем цвет многоточия
  const ellipsis = <span className="px-1.5 py-1.5 text-sm text-gray-500 dark:text-gray-400">...</span>;

  // Логика построения номеров страниц остается прежней
  pageNumbers.push(
    <Button
      key={1}
      variant={1 === currentPage ? 'primary' : 'secondary'}
      size="sm"
      onClick={() => handlePageClick(1)}
      className={`min-w-[36px] ${1 === currentPage ? 'z-10 ring-2 ring-indigo-500 dark:ring-indigo-400' : ''}`}
      aria-current={1 === currentPage ? 'page' : undefined}
    >
      1
    </Button>
  );

  if (currentPage > maxPagesToShow + 1) {
    pageNumbers.push(React.cloneElement(ellipsis, {key: "start-ellipsis"}));
  }

  let startPage = Math.max(2, currentPage - Math.floor(maxPagesToShow / 2));
  let endPage = Math.min(totalPages - 1, currentPage + Math.floor(maxPagesToShow / 2));
  
  if (currentPage < maxPagesToShow) {
      endPage = Math.min(totalPages - 1, maxPagesToShow);
  }
  if (currentPage > totalPages - (maxPagesToShow-1) ) {
      startPage = Math.max(2, totalPages - maxPagesToShow +1);
  }

  for (let i = startPage; i <= endPage; i++) {
    pageNumbers.push(
      <Button
        key={i}
        variant={i === currentPage ? 'primary' : 'secondary'}
        size="sm"
        onClick={() => handlePageClick(i)}
        className={`min-w-[36px] ${i === currentPage ? 'z-10 ring-2 ring-indigo-500 dark:ring-indigo-400' : ''}`}
        aria-current={i === currentPage ? 'page' : undefined}
      >
        {i}
      </Button>
    );
  }

  if (currentPage < totalPages - maxPagesToShow) {
     pageNumbers.push(React.cloneElement(ellipsis, {key: "end-ellipsis"}));
  }

  if (totalPages > 1) {
    pageNumbers.push(
      <Button
        key={totalPages}
        variant={totalPages === currentPage ? 'primary' : 'secondary'}
        size="sm"
        onClick={() => handlePageClick(totalPages)}
        className={`min-w-[36px] ${totalPages === currentPage ? 'z-10 ring-2 ring-indigo-500 dark:ring-indigo-400' : ''}`}
        aria-current={totalPages === currentPage ? 'page' : undefined}
      >
        {totalPages}
      </Button>
    );
  }
  
  const firstItemIndex = (currentPage - 1) * itemsPerPage + 1;
  const lastItemIndex = Math.min(currentPage * itemsPerPage, totalItems);

  return (
    <nav
      // 2. Адаптируем фон и границу контейнера пагинации
      className="flex flex-col md:flex-row items-center justify-between border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-4 py-3 sm:px-6 mt-4"
      aria-label="Pagination"
    >
      <div className="mb-2 md:mb-0 md:mr-auto">
        {totalItems > 0 && (
            // 3. Адаптируем информационный текст
            <p className="text-sm text-gray-700 dark:text-gray-300">
              Показано с <span className="font-medium">{firstItemIndex}</span> по <span className="font-medium">{lastItemIndex}</span> из <span className="font-medium">{totalItems}</span> результатов
            </p>
        )}
         {totalItems === 0 && (
            <p className="text-sm text-gray-700 dark:text-gray-300">Результатов нет</p>
         )}
      </div>
      <div className="flex items-center space-x-1">
        <Button
          variant="secondary"
          size="sm"
          onClick={() => handlePageClick(currentPage - 1)}
          disabled={currentPage === 1}
          iconLeft={<ChevronLeftIcon className="h-5 w-5" />}
          className="relative"
        >
          Назад
        </Button>
        <div className="hidden sm:flex items-center space-x-1">
            {pageNumbers}
        </div>
        {/* 4. Адаптируем текст для мобильной версии */}
        <div className="sm:hidden text-sm text-gray-700 dark:text-gray-300 px-2">
            {currentPage} / {totalPages}
        </div>
        <Button
          variant="secondary"
          size="sm"
          onClick={() => handlePageClick(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="relative"
        >
          {/* Иконка справа теперь передается через children */}
          <span className="flex items-center">
            Вперед
            <ChevronRightIcon className="h-5 w-5 ml-1" />
          </span>
        </Button>
      </div>
    </nav>
  );
};

export default Pagination;