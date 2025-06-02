// frontend/src/components/admin/UserManagement.jsx
import { useState, useEffect, useCallback, Fragment } from 'react';
import { useAuth } from '../../contexts/AuthContext'; //
import {
  EyeIcon,
  EyeSlashIcon,
  PencilSquareIcon,
  UserMinusIcon,
  PlusIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline'; //
import ConfirmationModal from '../ConfirmationModal'; //
import Modal from '../Modal'; //
import UserForm from './UserForm'; //
import Button from '../Button'; // Наш новый компонент кнопки
import { API_BASE_URL } from '../../apiConfig'; // Наша новая константа

const roleMapping = { //
  1: "Администратор",
  2: "Сотрудник"
};

const UserManagement = () => {
  const [users, setUsers] = useState([]); //
  const [isLoading, setIsLoading] = useState(true); //
  const [error, setError] = useState(null); //
  const { token, user: currentUser } = useAuth(); //

  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false); //
  const [confirmModalProps, setConfirmModalProps] = useState({ //
    title: '', message: '', onConfirm: () => {},
    confirmText: 'Да', confirmButtonVariant: 'primary',
  });

  const [isUserFormModalOpen, setIsUserFormModalOpen] = useState(false); //
  const [editingUser, setEditingUser] = useState(null); //

  const fetchUsers = useCallback(async () => { //
    if (!token) { //
      setError("Для доступа к управлению пользователями необходима аутентификация администратора."); //
      setIsLoading(false); //
      return; //
    }
    setIsLoading(true); //
    setError(null); //
    try {
      const headers = { 'Authorization': `Bearer ${token}` }; //
      const response = await fetch(`${API_BASE_URL}/users/?limit=100`, { headers }); // Используем API_BASE_URL
      if (!response.ok) { //
        if (response.status === 403) throw new Error("Доступ запрещен. Требуются права администратора."); //
        const errorData = await response.json().catch(() => ({})); //
        throw new Error(errorData.detail || `Ошибка загрузки пользователей: ${response.status}`); //
      }
      const data = await response.json(); //
      setUsers(data); //
    } catch (err) { //
      setError(err.message); //
      console.error("UserManagement: Ошибка загрузки пользователей:", err); //
    } finally { //
      setIsLoading(false); //
    }
  }, [token]); //

  useEffect(() => { //
    if (token && currentUser?.role_id === 1) { //
        fetchUsers(); //
    } else if (currentUser && currentUser.role_id !== 1) { //
        setError("Доступ запрещен. Эта секция только для администраторов."); //
        setIsLoading(false); //
    }
  }, [fetchUsers, token, currentUser]); //

  const handleToggleActiveStatus = async (userToToggle) => { //
    if (!token || !currentUser || currentUser.id === userToToggle.id) { //
        setError("Нельзя изменить статус активности для самого себя или нет прав."); //
        return; //
    }

    const newActiveState = !userToToggle.is_active; //
    const payload = { is_active: newActiveState }; //

    try {
        const headers = { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }; //
        const response = await fetch(`${API_BASE_URL}/users/${userToToggle.id}`, { // Используем API_BASE_URL
            method: 'PUT', //
            headers: headers, //
            body: JSON.stringify(payload) //
        });
        if (!response.ok) { //
            const errorData = await response.json().catch(() => ({})); //
            throw new Error(errorData.detail || `Ошибка обновления статуса пользователя: ${response.status}`); //
        }
        fetchUsers(); //
        setError(null); //
    } catch (err) { //
        setError(err.message); //
        console.error("UserManagement: Ошибка обновления статуса:", err); //
    }
  };

  const handleDeleteUserRequest = async (userIdToDelete) => { //
    try {
        const headers = { 'Authorization': `Bearer ${token}` }; //
        const response = await fetch(`${API_BASE_URL}/users/${userIdToDelete}`, { // Используем API_BASE_URL
            method: 'DELETE', //
            headers: headers //
        });
        if (!response.ok) { //
            const errorData = await response.json().catch(() => ({})); //
            throw new Error(errorData.detail || `Ошибка деактивации/удаления пользователя: ${response.status}`); //
        }
        fetchUsers(); //
        setError(null); //
    } catch (err) { //
        setError(err.message); //
        console.error("UserManagement: Ошибка деактивации/удаления пользователя:", err); //
    } finally { //
        setIsConfirmModalOpen(false); //
    }
  };

  const handleDeleteUser = (userToDelete) => { //
    if (!currentUser || currentUser.id === userToDelete.id) { //
        setError("Нельзя деактивировать/удалить самого себя."); //
        return; //
    }

    setConfirmModalProps({ //
        title: userToDelete.is_active ? "Подтверждение деактивации" : "Подтверждение удаления",
        message: `Вы уверены, что хотите ${userToDelete.is_active ? 'деактивировать' : 'удалить (если бэкенд это поддерживает, иначе деактивировать)'} пользователя "${userToDelete.username}"? ${userToDelete.is_active ? 'Он не сможет войти в систему.' : ''}`,
        confirmText: userToDelete.is_active ? "Деактивировать" : "Удалить",
        confirmButtonVariant: "danger",
        onConfirm: () => handleDeleteUserRequest(userToDelete.id)
    });
    setIsConfirmModalOpen(true); //
  };

  const handleOpenCreateUserModal = () => { //
    setEditingUser(null); //
    setIsUserFormModalOpen(true); //
  };

  const handleOpenEditUserModal = (user) => { //
    setEditingUser(user); //
    setIsUserFormModalOpen(true); //
  };

  const handleCloseUserFormModal = () => { //
    setIsUserFormModalOpen(false); //
    setEditingUser(null); //
  };

  const handleUserFormSuccess = () => { //
    fetchUsers(); //
    handleCloseUserFormModal(); //
  };


  if (isLoading && !users.length) { //
    return (
        <div className="flex justify-center items-center h-32"> {/* */}
            <svg className="animate-spin h-8 w-8 text-indigo-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"> {/* */}
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle> {/* */}
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path> {/* */}
            </svg>
            <p className="ml-3 text-gray-500">Загрузка списка пользователей...</p> {/* */}
        </div>
    );
  }

  if (error && !isLoading && (!users || users.length === 0)) { //
    return (
        <div className="rounded-md bg-red-50 p-4 my-4 shadow"> {/* */}
            <div className="flex"> {/* */}
                <div className="flex-shrink-0"> {/* */}
                    <ExclamationTriangleIcon className="h-5 w-5 text-red-400" aria-hidden="true" /> {/* */}
                </div>
                <div className="ml-3"> {/* */}
                    <h3 className="text-sm font-medium text-red-800">Ошибка</h3> {/* */}
                    <div className="mt-2 text-sm text-red-700"><p>{error}</p></div> {/* */}
                </div>
            </div>
        </div>
    );
  }

  return (
    <div>
      <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-3">
        <h3 className="text-xl font-semibold text-gray-800">Список Пользователей</h3> {/* */}
        <Button
            variant="primary"
            size="md"
            onClick={handleOpenCreateUserModal}
            iconLeft={<PlusIcon className="h-5 w-5" />} //
            className="w-full sm:w-auto"
        >
            Добавить пользователя
        </Button>
      </div>

      {error && users.length > 0 && <div className="mb-4 rounded-md bg-red-50 p-3 text-sm text-red-700">{error}</div>} {/* */}

      {users.length === 0 && !isLoading && !error && ( //
        <p className="text-gray-500">Пользователи не найдены.</p> //
      )}

      {users.length > 0 && ( //
        <div className="overflow-x-auto bg-white shadow-md rounded-lg"> {/* */}
          <table className="min-w-full divide-y divide-gray-200"> {/* */}
            <thead className="bg-gray-50"> {/* */}
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider sm:px-6">ID</th> {/* */}
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Username</th> {/* */}
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden md:table-cell">Email</th> {/* */}
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden lg:table-cell">Full Name</th> {/* */}
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Роль</th> {/* */}
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Статус</th> {/* */}
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider sm:px-6">Действия</th> {/* */}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200"> {/* */}
              {users.map((userItem) => ( //
                <tr key={userItem.id} className="hover:bg-gray-50"> {/* */}
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500 sm:px-6">{userItem.id}</td> {/* */}
                  <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">{userItem.username}</td> {/* */}
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500 hidden md:table-cell">{userItem.email}</td> {/* */}
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500 hidden lg:table-cell">{userItem.full_name || '-'}</td> {/* */}
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500"> {/* */}
                    {roleMapping[userItem.role_id] || `ID: ${userItem.role_id}`} {/* */}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-center"> {/* */}
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${userItem.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}> {/* */}
                      {userItem.is_active ? 'Активен' : 'Неактивен'} {/* */}
                    </span>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-right text-sm font-medium space-x-1 sm:px-6">
                    <Button
                      variant="icon"
                      size="sm"
                      onClick={() => handleToggleActiveStatus(userItem)} //
                      disabled={currentUser?.id === userItem.id} //
                      title={userItem.is_active ? 'Деактивировать' : 'Активировать'} //
                      className={userItem.is_active ? 'text-yellow-500 hover:text-yellow-600 focus:ring-yellow-500' : 'text-green-500 hover:text-green-600 focus:ring-green-500'} //
                    >
                      {userItem.is_active ? <EyeSlashIcon className="h-5 w-5" /> : <EyeIcon className="h-5 w-5" />} {/* */}
                    </Button>
                    <Button
                      variant="icon"
                      size="sm"
                      onClick={() => handleOpenEditUserModal(userItem)} //
                      disabled={currentUser?.id === userItem.id && userItem.role_id === 1} //
                      title="Редактировать пользователя" //
                      className="text-blue-500 hover:text-blue-700 focus:ring-blue-500" //
                    >
                      <PencilSquareIcon className="h-5 w-5" /> {/* */}
                    </Button>
                    <Button
                      variant="icon"
                      size="sm"
                      onClick={() => handleDeleteUser(userItem)} //
                      disabled={currentUser?.id === userItem.id || (userItem.role_id === 1 && users.filter(u => u.role_id === 1 && u.is_active).length <= 1)} //
                      title={userItem.is_active ? "Деактивировать пользователя" : "Удалить пользователя (если бэкенд поддерживает)"} //
                      className="text-red-500 hover:text-red-700 focus:ring-red-500" //
                    >
                      <UserMinusIcon className="h-5 w-5" /> {/* */}
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <ConfirmationModal
        isOpen={isConfirmModalOpen} //
        onClose={() => setIsConfirmModalOpen(false)} //
        {...confirmModalProps} //
      />
      <Modal
        isOpen={isUserFormModalOpen} //
        onClose={handleCloseUserFormModal} //
        title={editingUser ? `Редактирование: ${editingUser.username}` : "Создание нового пользователя"} //
      >
        <UserForm
          userToEdit={editingUser} //
          onSuccess={handleUserFormSuccess} //
          onCancel={handleCloseUserFormModal} //
          key={editingUser ? `edit-user-${editingUser.id}` : 'create-user'} //
        />
      </Modal>
    </div>
  );
};

export default UserManagement; //