// src/components/admin/UserForm.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../contexts/AuthContext';

const UserForm = ({ userToEdit, onSuccess, onCancel }) => {
  const isEditMode = Boolean(userToEdit);
  const { token } = useAuth();

  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [fullName, setFullName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [roleId, setRoleId] = useState(''); // ID роли "Сотрудник" может быть 2
  const [isActive, setIsActive] = useState(true);
  
  const [availableRoles, setAvailableRoles] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [fetchRolesError, setFetchRolesError] = useState(null);

  const commonLabelClasses = "block text-sm font-medium text-gray-700 mb-1";
  const commonInputClasses = "mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm h-10";
  const baseButtonClasses = "inline-flex items-center justify-center px-4 py-2 border text-sm font-medium rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 h-10 disabled:opacity-50";
  const primaryButtonClasses = `${baseButtonClasses} text-white bg-indigo-600 hover:bg-indigo-700 focus:ring-indigo-500`;
  const secondaryButtonClasses = `${baseButtonClasses} text-gray-700 bg-white hover:bg-gray-50 border-gray-300 focus:ring-indigo-500`;

  // Загрузка списка ролей
  const fetchRoles = useCallback(async () => {
    if (!token) {
        setFetchRolesError("Необходима аутентификация администратора для загрузки ролей.");
        return;
    }
    setFetchRolesError(null);
    try {
      const headers = { 'Authorization': `Bearer ${token}` };
      const response = await fetch('http://localhost:8000/roles/?limit=100', { headers });
      if (!response.ok) {
        if (response.status === 403) throw new Error("Доступ к ролям запрещен.");
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || `Ошибка загрузки ролей: ${response.status}`);
      }
      const data = await response.json();
      setAvailableRoles(data);
      if (!isEditMode && data.length > 0) { // Устанавливаем роль "Сотрудник" по умолчанию для новых
        const employeeRole = data.find(r => r.name === 'employee'); // Или по ID, если он известен (например, 2)
        if (employeeRole) setRoleId(employeeRole.id.toString());
        else if (data.length > 0) setRoleId(data[0].id.toString()); // Или первую доступную
      }
    } catch (err) {
      setFetchRolesError(err.message);
      console.error("UserForm: Ошибка загрузки ролей:", err);
    }
  }, [token, isEditMode]); // isEditMode в зависимостях для установки дефолтной роли

  useEffect(() => {
    fetchRoles();
  }, [fetchRoles]);

  // Предзаполнение формы, если это режим редактирования
  useEffect(() => {
    if (isEditMode && userToEdit) {
      setUsername(userToEdit.username || '');
      setEmail(userToEdit.email || '');
      setFullName(userToEdit.full_name || '');
      setIsActive(userToEdit.is_active !== undefined ? userToEdit.is_active : true);
      setRoleId(userToEdit.role_id?.toString() || '');
      setPassword(''); // Пароль не предзаполняем для редактирования
      setConfirmPassword('');
    } else {
      // Сброс для режима создания (или если userToEdit null)
      setUsername('');
      setEmail('');
      setFullName('');
      setPassword('');
      setConfirmPassword('');
      setIsActive(true);
      // Роль по умолчанию уже устанавливается в fetchRoles, если availableRoles загружены
      if (availableRoles.length > 0 && !roleId) {
         const employeeRole = availableRoles.find(r => r.name === 'employee');
         if (employeeRole) setRoleId(employeeRole.id.toString());
         else setRoleId(availableRoles[0].id.toString());
      } else if (availableRoles.length === 0) {
          setRoleId(''); // Если роли еще не загружены
      }
    }
  }, [isEditMode, userToEdit, availableRoles, roleId]); // Добавил roleId для корректной установки дефолта

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    if (!isEditMode && password !== confirmPassword) {
      setError("Пароли не совпадают.");
      setIsLoading(false);
      return;
    }
    if (!roleId) {
        setError("Необходимо выбрать роль для пользователя.");
        setIsLoading(false);
        return;
    }

    let payload;
    let url;
    let method;

    if (isEditMode) {
      payload = {
        email: email,
        full_name: fullName || null,
        is_active: isActive,
        role_id: parseInt(roleId, 10),
      };
      // Если нужно позволить менять пароль при редактировании, добавить логику здесь
      // if (password) payload.password = password; // Потребует изменения схемы UserUpdateAdmin
      url = `http://localhost:8000/users/${userToEdit.id}`;
      method = 'PUT';
    } else {
      payload = {
        username: username,
        email: email,
        full_name: fullName || null,
        password: password,
        role_id: parseInt(roleId, 10),
        is_active: isActive,
      };
      url = 'http://localhost:8000/users/';
      method = 'POST';
    }

    try {
      const headers = { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` };
      const response = await fetch(url, {
        method: method,
        headers: headers,
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || `Ошибка ${isEditMode ? 'обновления' : 'создания'} пользователя: ${response.status} ${response.statusText}`);
      }
      
      onSuccess(); // Вызываем колбэк из родительского компонента
    } catch (err) {
      setError(err.message);
      console.error(`UserForm: Ошибка при ${isEditMode ? 'обновлении' : 'создании'} пользователя:`, err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && <p className="text-sm text-red-600 bg-red-100 p-3 rounded-md border border-red-200">{error}</p>}
      {fetchRolesError && <p className="text-sm text-orange-600 bg-orange-100 p-3 rounded-md border border-orange-200">Ошибка загрузки ролей: {fetchRolesError}</p>}

      <div>
        <label htmlFor="username-userform" className={commonLabelClasses}>Имя пользователя (логин)</label>
        <input type="text" id="username-userform" value={username} onChange={(e) => setUsername(e.target.value)}
               required disabled={isEditMode} // Запрещаем редактирование username
               className={`${commonInputClasses} ${isEditMode ? 'bg-gray-100 cursor-not-allowed' : ''}`} />
      </div>

      <div>
        <label htmlFor="email-userform" className={commonLabelClasses}>Email</label>
        <input type="email" id="email-userform" value={email} onChange={(e) => setEmail(e.target.value)}
               required className={commonInputClasses} />
      </div>

      <div>
        <label htmlFor="fullName-userform" className={commonLabelClasses}>Полное имя</label>
        <input type="text" id="fullName-userform" value={fullName} onChange={(e) => setFullName(e.target.value)}
               className={commonInputClasses} />
      </div>

      {!isEditMode && ( // Поля пароля только при создании
        <>
          <div>
            <label htmlFor="password-userform" className={commonLabelClasses}>Пароль</label>
            <input type="password" id="password-userform" value={password} onChange={(e) => setPassword(e.target.value)}
                   required={!isEditMode} className={commonInputClasses} />
          </div>
          <div>
            <label htmlFor="confirmPassword-userform" className={commonLabelClasses}>Подтвердите пароль</label>
            <input type="password" id="confirmPassword-userform" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)}
                   required={!isEditMode} className={commonInputClasses} />
          </div>
        </>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center">
        <div>
            <label htmlFor="roleId-userform" className={commonLabelClasses}>Роль</label>
            <select id="roleId-userform" value={roleId} onChange={(e) => setRoleId(e.target.value)} required className={commonInputClasses}>
                <option value="" disabled>-- Выберите роль --</option>
                {availableRoles.map(role => (
                <option key={role.id} value={role.id}>{role.name}</option>
                ))}
            </select>
        </div>
        <div className="pt-5"> {/* Отступ для чекбокса, чтобы он был примерно на уровне инпута */}
            <div className="flex items-center">
                <input id="isActive-userform" name="isActive" type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)}
                    className="h-4 w-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"/>
                <label htmlFor="isActive-userform" className="ml-2 block text-sm text-gray-900">Активен</label>
            </div>
        </div>
      </div>

      <div className="pt-3 flex justify-end space-x-3">
        <button type="button" onClick={onCancel} className={secondaryButtonClasses} disabled={isLoading}>
          Отмена
        </button>
        <button type="submit" className={primaryButtonClasses} disabled={isLoading}>
          {isLoading ? 'Сохранение...' : (isEditMode ? 'Сохранить изменения' : 'Создать пользователя')}
        </button>
      </div>
    </form>
  );
};

export default UserForm;