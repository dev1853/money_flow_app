// src/pages/AdminPanelPage.jsx
import React from 'react';
import UserManagement from '../components/admin/UserManagement'; //
import PageTitle from '../components/PageTitle'; // <--- ДОБАВЛЕН ИМПОРТ

// import RoleManagement from '../components/admin/RoleManagement'; // Для будущего

const AdminPanelPage = () => {
  // Здесь можно добавить проверку роли пользователя, если ProtectedRoutesWithMainLayout этого не делает
  // const { user } = useAuth();
  // if (!user || user.role_id !== 1) {
  //   return <div className="p-6 text-center text-red-500">Доступ запрещен. Только для администраторов.</div>;
  // }

  return (
    <div className="space-y-8"> {/* */}
      <PageTitle title="Панель Администратора" />

      {/* Секция Управления Пользователями */}
      <div className="bg-white shadow-xl rounded-2xl p-6"> {/* */}
        <UserManagement /> {/* */}
      </div>

      {/* Заглушка для Управления Ролями */}
      <div className="bg-white shadow-xl rounded-2xl p-6 mt-8"> {/* */}
        <h3 className="text-xl font-semibold text-gray-800 mb-4">Управление Ролями</h3> {/* */}
        <p className="text-gray-600">Здесь будет интерфейс для управления ролями.</p> {/* */}
        {/* TODO: Вставить компонент RoleManagement */}
      </div>
    </div>
  );
};

export default AdminPanelPage; //