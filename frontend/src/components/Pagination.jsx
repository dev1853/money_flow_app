// frontend/src/components/Pagination.jsx
import React from 'react';
import Button from './Button'; // Используем наш компонент Button
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/20/solid';

const Pagination = ({
  currentPage,
  totalPages,
  onPageChange,
  itemsPerPage, // Для информации "Показано X-Y из Z"
  totalItems,   // Для информации "Показано X-Y из Z"
}) => {
  if (totalPages <= 1) {
    return null; // Не отображаем пагинацию, если страниц мало
  }

  const handlePageClick = (pageNumber) => {
    if (pageNumber >= 1 && pageNumber <= totalPages && pageNumber !== currentPage) {
      onPageChange(pageNumber);
    }
  };

  // Логика для отображения номеров страниц с многоточием
  const pageNumbers = [];
  const maxPagesToShow = 3; // Сколько номеров страниц показывать вокруг текущей (не считая первую и последнюю)
  const ellipsis = <span className="px-1.5 py-1.5 text-sm text-gray-500">...</span>;

  // Всегда добавляем первую страницу
  pageNumbers.push(
    <Button
      key={1}
      variant={1 === currentPage ? 'primary' : 'secondary'}
      size="sm"
      onClick={() => handlePageClick(1)}
      className={`min-w-[36px] ${1 === currentPage ? 'z-10 ring-2 ring-indigo-500' : ''}`}
      aria-current={1 === currentPage ? 'page' : undefined}
    >
      1
    </Button>
  );

  // Логика для многоточия и средних номеров
  if (currentPage > maxPagesToShow + 1) {
    pageNumbers.push(React.cloneElement(ellipsis, {key: "start-ellipsis"}));
  }

  let startPage = Math.max(2, currentPage - Math.floor(maxPagesToShow / 2));
  let endPage = Math.min(totalPages - 1, currentPage + Math.floor(maxPagesToShow / 2));
  
  // Корректируем диапазон, если он слишком мал из-за близости к краям
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
        className={`min-w-[36px] ${i === currentPage ? 'z-10 ring-2 ring-indigo-500' : ''}`}
        aria-current={i === currentPage ? 'page' : undefined}
      >
        {i}
      </Button>
    );
  }

  if (currentPage < totalPages - maxPagesToShow) {
     pageNumbers.push(React.cloneElement(ellipsis, {key: "end-ellipsis"}));
  }

  // Всегда добавляем последнюю страницу, если она не 1
  if (totalPages > 1) {
    pageNumbers.push(
      <Button
        key={totalPages}
        variant={totalPages === currentPage ? 'primary' : 'secondary'}
        size="sm"
        onClick={() => handlePageClick(totalPages)}
        className={`min-w-[36px] ${totalPages === currentPage ? 'z-10 ring-2 ring-indigo-500' : ''}`}
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
      className="flex flex-col md:flex-row items-center justify-between border-t border-gray-200 bg-white px-4 py-3 sm:px-6 mt-4"
      aria-label="Pagination"
    >
      <div className="mb-2 md:mb-0 md:mr-auto">
        {totalItems > 0 && (
            <p className="text-sm text-gray-700">
            Показано с <span className="font-medium">{firstItemIndex}</span> по <span className="font-medium">{lastItemIndex}</span> из <span className="font-medium">{totalItems}</span> результатов
            </p>
        )}
         {totalItems === 0 && (
            <p className="text-sm text-gray-700">Результатов нет</p>
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
        {/* Номера страниц для больших экранов */}
        <div className="hidden sm:flex items-center space-x-1">
            {pageNumbers}
        </div>
         {/* Информация о текущей странице для мобильных */}
        <div className="sm:hidden text-sm text-gray-700 px-2">
            {currentPage} / {totalPages}
        </div>
        <Button
          variant="secondary"
          size="sm"
          onClick={() => handlePageClick(currentPage + 1)}
          disabled={currentPage === totalPages}
          iconRight={<ChevronRightIcon className="h-5 w-5" />}
          className="relative"
        >
          Вперед
        </Button>
      </div>
    </nav>
  );
};

export default Pagination;