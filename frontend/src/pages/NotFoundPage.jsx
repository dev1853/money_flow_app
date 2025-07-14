// frontend/src/pages/NotFoundPage.jsx
import React from 'react';
import { Link } from 'react-router-dom';
import Button from '../components/Button';
import { HomeIcon } from '@heroicons/react/24/solid';

const NotFoundPage = () => {
  return (
    // Эта страница, скорее всего, будет использовать AuthLayout,
    // но если нет, можно задать фон прямо здесь.
    <main className="grid min-h-full place-items-center bg-white dark:bg-gray-900 px-6 py-24 sm:py-32 lg:px-8">
      <div className="text-center">
        <p className="text-base font-semibold text-indigo-600 dark:text-indigo-400">404</p>
        <h1 className="mt-4 text-3xl font-bold tracking-tight text-gray-900 dark:text-gray-100 sm:text-5xl">
          Страница не найдена
        </h1>
        <p className="mt-6 text-base leading-7 text-gray-600 dark:text-gray-400">
          Извините, мы не смогли найти страницу, которую вы ищете.
        </p>
        <div className="mt-10 flex items-center justify-center gap-x-6">
          <Link to="/dashboard">
            <Button iconLeft={<HomeIcon className="h-5 w-5" />}>
              На главную
            </Button>
          </Link>
        </div>
      </div>
    </main>
  );
};

export default NotFoundPage;