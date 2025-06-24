// frontend/src/components/admin/UserManagement.jsx
import { useState, useEffect, useCallback, Fragment } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import {
  EyeIcon,
  EyeSlashIcon,
  PencilSquareIcon,
  UserMinusIcon,
  PlusIcon,
  UsersIcon
} from '@heroicons/react/24/outline';
import ConfirmationModal from '../ConfirmationModal';
import Modal from '../Modal';
import UserForm from './UserForm';
import Button from '../Button';
import Loader from '../Loader';
import Alert from '../Alert';
import EmptyState from '../EmptyState';
import { apiService, ApiError } from '../../services/apiService';

const roleMapping = {
  1: "Администратор",
  2: "Сотрудник"
};

const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const { user: currentUser, logout } = useAuth();

  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [confirmModalProps, setConfirmModalProps] = useState({
    title: '', message: '', onConfirm: () => {},
    confirmText: 'Да', confirmButtonVariant: 'primary',
  });

  const [isUserFormModalOpen, setIsUserFormModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);

  // Уникальный ID для формы пользователя
  const USER_FORM_ID = "userForm";

  const fetchUsers = useCallback(async () => {
    if (!currentUser || currentUser.role_id !== 1) {
        setError("Доступ запрещен. Эта секция только для администраторов.");
        setIsLoading(false);
        return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const data = await apiService.get('/api/users/?limit=100');
      setUsers(data.results || data);
    } catch (err) {
      console.error("UserManagement: Ошибка загрузки пользователей:", err);
      if (err instanceof ApiError) {
        if (err.status === 401 || err.status === 403) {
            setError(err.message || "Доступ запрещен или сессия истекла.");
        } else {
            setError(err.message || "Не удалось загрузить пользователей.");
        }
      } else {
        setError("Произошла неизвестная ошибка при загрузке пользователей.");
      }
      setUsers([]);
    } finally {
      setIsLoading(false);
    }
  }, [currentUser]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleToggleActiveStatus = async (userToToggle) => {
    if (!currentUser || currentUser.id === userToToggle.id) {
        setError("Нельзя изменить статус активности для самого себя или нет прав.");
        return;
    }
    const newActiveState = !userToToggle.is_active;
    const payload = { is_active: newActiveState };
    setError(null);

    try {
        await apiService.put(`/api/users/${userToToggle.id}`, payload);
        setUsers(prevUsers => prevUsers.map(u => u.id === userToToggle.id ? {...u, is_active: newActiveState} : u));
    } catch (err) {
        console.error("UserManagement: Ошибка обновления статуса:", err);
        setError( (err instanceof ApiError ? err.message : null) || "Не удалось обновить статус пользователя.");
    }
  };

  const handleDeleteUserRequest = async (userIdToDelete) => {
    setError(null);
    try {
        await apiService.delete(`/api/users/${userIdToDelete}`); // Здесь может быть деактивация, а не удаление
        fetchUsers();
    } catch (err) {
        console.error("UserManagement: Ошибка деактивации/удаления пользователя:", err);
        setError( (err instanceof ApiError ? err.message : null) || "Не удалось удалить пользователя.");
    } finally {
        setIsConfirmModalOpen(false);
    }
  };

  const handleDeleteUser = (userToDelete) => {
    if (!currentUser || currentUser.id === userToDelete.id) {
        setError("Нельзя деактивировать/удалить самого себя.");
        return;
    }
    setConfirmModalProps({
        title: userToDelete.is_active ? "Подтверждение деактивации" : "Подтверждение удаления",
        message: `Вы уверены, что хотите ${userToDelete.is_active ? 'деактивировать' : 'удалить (если бэкенд это поддерживает, иначе деактивировать)'} пользователя "${userToDelete.username}"? ${userToDelete.is_active ? 'Он не сможет войти в систему.' : ''}`,
        confirmText: userToDelete.is_active ? "Деактивировать" : "Удалить",
        confirmButtonVariant: "danger",
        onConfirm: () => handleDeleteUserRequest(userToDelete.id)
    });
    setIsConfirmModalOpen(true);
  };

  const handleOpenCreateUserModal = () => { setEditingUser(null); setIsUserFormModalOpen(true); };
  const handleOpenEditUserModal = (user) => { setEditingUser(user); setIsUserFormModalOpen(true); };
  const handleCloseUserFormModal = () => { setIsUserFormModalOpen(false); setEditingUser(null); };
  const handleUserFormSuccess = () => { fetchUsers(); handleCloseUserFormModal(); };

  // Футер для модального окна UserForm
  // Обратите внимание: UserForm сам содержит кнопки, поэтому нужно решить:
  // 1. Либо удалить кнопки из UserForm и управлять ими здесь.
  // 2. Либо не передавать footer в Modal для UserForm.
  // Поскольку я уже изменил UserForm, чтобы он *содержал* кнопки,
  // я не буду передавать `footer` в `Modal` для `UserForm`.
  // Если ты хочешь, чтобы кнопки были ВНЕ UserForm, дай знать.
  // На данный момент UserForm останется исключением в этом плане.

  if (isLoading && users.length === 0) {
    return (
        <div className="flex flex-col items-center justify-center py-10">
            <Loader message="Загрузка списка пользователей..." />
        </div>
    );
  }

  if (error && !isLoading && users.length === 0) {
    return (
        <div className="my-4">
            <Alert type="error" title="Ошибка загрузки" message={error} />
        </div>
    );
  }

  return (
    <div>
      <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-3">
        <h3 className="text-xl font-semibold text-gray-800">Список Пользователей</h3>
        <Button
            variant="primary"
            size="md"
            onClick={handleOpenCreateUserModal}
            iconLeft={<PlusIcon className="h-5 w-5" />}
            className="w-full sm:w-auto"
        >
            Добавить пользователя
        </Button>
      </div>

      {error && users.length > 0 && <Alert type="error" message={error} className="mb-4" />}

      {!isLoading && !error && users.length === 0 && (
        <EmptyState
            icon={<UsersIcon />}
            title="Пользователи не найдены"
            message="Пока нет ни одного пользователя в системе. Вы можете добавить первого."
            actionButton={
                <Button variant="primary" onClick={handleOpenCreateUserModal} iconLeft={<PlusIcon className="h-5 w-5" />}>
                    Добавить пользователя
                </Button>
            }
        />
      )}

      {users.length > 0 && (
        <div className="overflow-x-auto bg-white shadow-md rounded-lg">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider sm:px-6">ID</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Username</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden md:table-cell">Email</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden lg:table-cell">Full Name</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Роль</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Статус</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider sm:px-6">Действия</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">{
              users.map((userItem) => (
                <tr key={userItem.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500 sm:px-6">{userItem.id}</td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">{userItem.username}</td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500 hidden md:table-cell">{userItem.email}</td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500 hidden lg:table-cell">{userItem.full_name || '-'}</td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                    {roleMapping[userItem.role_id] || `ID: ${userItem.role_id}`}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-center">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${userItem.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                      {userItem.is_active ? 'Активен' : 'Неактивен'}
                    </span>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-right text-sm font-medium space-x-1 sm:px-6">
                    <Button
                      variant="icon"
                      size="sm"
                      onClick={() => handleToggleActiveStatus(userItem)}
                      disabled={currentUser?.id === userItem.id}
                      title={userItem.is_active ? 'Деактивировать' : 'Активировать'}
                      className={userItem.is_active ? 'text-yellow-500 hover:text-yellow-600 focus:ring-yellow-500' : 'text-green-500 hover:text-green-600 focus:ring-green-500'}
                    >
                      {userItem.is_active ? <EyeSlashIcon className="h-5 w-5" /> : <EyeIcon className="h-5 w-5" />}
                    </Button>
                    <Button
                      variant="icon"
                      size="sm"
                      onClick={() => handleOpenEditUserModal(userItem)}
                      disabled={currentUser?.id === userItem.id && userItem.role_id === 1}
                      title="Редактировать пользователя"
                      className="text-blue-500 hover:text-blue-700 focus:ring-blue-500"
                    >
                      <PencilSquareIcon className="h-5 w-5" />
                    </Button>
                    <Button
                      variant="icon"
                      size="sm"
                      onClick={() => handleDeleteUser(userItem)}
                      disabled={currentUser?.id === userItem.id || (userItem.role_id === 1 && users.filter(u => u.role_id === 1 && u.is_active).length <= 1)}
                      title={userItem.is_active ? "Деактивировать пользователя" : "Удалить пользователя (если бэкенд поддерживает)"}
                      className="text-red-500 hover:text-red-700 focus:ring-red-500"
                    >
                      <UserMinusIcon className="h-5 w-5" />
                    </Button>
                  </td>
                </tr>
              ))
            }</tbody>
          </table>
        </div>
      )}
      <ConfirmationModal
        isOpen={isConfirmModalOpen}
        onClose={() => setIsConfirmModalOpen(false)}
        {...confirmModalProps}
      />
      <Modal
        isOpen={isUserFormModalOpen}
        onClose={handleCloseUserFormModal}
        title={editingUser ? `Редактирование: ${editingUser.username}` : "Создание нового пользователя"}
        // ВАЖНО: UserForm сам содержит кнопки, поэтому footer здесь не передаем
      >
        <UserForm
          userToEdit={editingUser}
          onSuccess={handleUserFormSuccess}
          onCancel={handleCloseUserFormModal} // onCancel передаем для внутренней кнопки "Отмена"
          key={editingUser ? `edit-user-${editingUser.id}` : 'create-user'}
        />
      </Modal>
    </div>
  );
};

export default UserManagement;