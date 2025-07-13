// frontend/src/pages/NotFoundPage.jsx

import React from 'react';
import { Link } from 'react-router-dom';
import PageTitle from '../components/PageTitle'; // Используем существующий компонент PageTitle
import Button from '../components/Button'; // Используем существующий компонент Button

function NotFoundPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 text-gray-800 p-4">
      <div className="text-center p-8 bg-white rounded-lg shadow-xl">
        <PageTitle title="404 - Страница не найдена" /> {/* Используем PageTitle */}
        <p className="text-xl text-gray-600 mb-6">
          Упс! Кажется, вы забрели не туда. Страница, которую вы ищете, не существует.
        </p>
        <Link to="/dashboard">
          <Button>Вернуться на главную</Button> {/* Используем компонент Button */}
        </Link>
      </div>
    </div>
  );
}

export default NotFoundPage;