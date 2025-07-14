// frontend/src/pages/AdminPanelPage.jsx
import React from 'react';
import UserManagement from '../components/admin/UserManagement';
import PageTitle from '../components/PageTitle';

const AdminPanelPage = () => {
  return (
    <div className="space-y-8">
      <PageTitle title="Панель Администратора" />

      {/* Адаптируем фон, тень и границу для контейнера */}
      <div className="bg-white dark:bg-gray-800 shadow-lg dark:shadow-2xl dark:shadow-indigo-500/10 rounded-2xl p-6 border border-gray-200 dark:border-gray-700">
        <UserManagement />
      </div>

      <div className="bg-white dark:bg-gray-800 shadow-lg dark:shadow-2xl dark:shadow-indigo-500/10 rounded-2xl p-6 mt-8 border border-gray-200 dark:border-gray-700">
        {/* Адаптируем цвет текста */}
        <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-100 mb-4">Управление Ролями</h3>
        <p className="text-gray-600 dark:text-gray-400">Здесь будет интерфейс для управления ролями.</p>
      </div>
    </div>
  );
};

export default AdminPanelPage;