// frontend/src/components/admin/UserForm.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../contexts/AuthContext'; // - может понадобиться для isAuthenticated или других данных пользователя
import Button from '../Button';
import { API_BASE_URL } from '../../apiConfig'; // Больше не нужен для прямых вызовов fetch, но оставим, если где-то еще используется. Лучше удалить, если apiService покрывает все.
import { apiService, ApiError } from '../../services/apiService'; 
import Loader from '../Loader';// <--- НАШ НОВЫЙ СЕРВИС

const UserForm = ({ userToEdit, onSuccess, onCancel }) => {
  const isEditMode = Boolean(userToEdit); //
  // const { token } = useAuth(); // Токен теперь получается внутри apiService из localStorage

  const [username, setUsername] = useState(''); //
  const [email, setEmail] = useState(''); //
  const [fullName, setFullName] = useState(''); //
  const [password, setPassword] = useState(''); //
  const [confirmPassword, setConfirmPassword] = useState(''); //
  const [roleId, setRoleId] = useState(''); //
  const [isActive, setIsActive] = useState(true); //

  const [availableRoles, setAvailableRoles] = useState([]); //
  const [isLoading, setIsLoading] = useState(false); // Это isLoading для submit формы, не для fetchRoles
  const [isRolesLoading, setIsRolesLoading] = useState(false); // Отдельный лоадер для ролей
  const [error, setError] = useState(null); // Ошибка для submit формы
  const [fetchRolesError, setFetchRolesError] = useState(null); //

  const commonLabelClasses = "block text-sm font-medium text-gray-700 mb-1"; //
  const commonInputClasses = "mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm h-10"; //

  const fetchRoles = useCallback(async () => { //
    setIsRolesLoading(true);
    setFetchRolesError(null);
    try {
      // apiService сам добавит токен из localStorage
      const data = await apiService.get('/roles/?limit=100'); //
      setAvailableRoles(data); //
      if (!isEditMode && data.length > 0) { //
        const employeeRole = data.find(r => r.name === 'employee'); //
        if (employeeRole) setRoleId(employeeRole.id.toString()); //
        else if (data.length > 0) setRoleId(data[0].id.toString()); //
      }
    } catch (err) { //
      console.error("UserForm: Ошибка загрузки ролей:", err); //
      if (err instanceof ApiError) {
        setFetchRolesError(err.message || "Не удалось загрузить роли.");
      } else {
        setFetchRolesError("Произошла неизвестная ошибка при загрузке ролей.");
      }
    } finally {
      setIsRolesLoading(false);
    }
  }, [isEditMode]); // Токен убран из зависимостей

  useEffect(() => { //
    fetchRoles();
  }, [fetchRoles]); //

  useEffect(() => { /* ... логика заполнения полей формы ... без изменений ... */ }, [isEditMode, userToEdit, availableRoles, roleId]); //

  const handleSubmit = async (e) => { //
    e.preventDefault(); //
    setError(null);
    setIsLoading(true); //

    if (!isEditMode && password !== confirmPassword) { /* ... проверки ... */ return; } //
    if (!roleId) { /* ... проверки ... */ return; } //

    let payload; //
    let endpoint;
    let methodType;

    if (isEditMode) { //
      payload = { //
        email: email,
        full_name: fullName || null,
        is_active: isActive,
        role_id: parseInt(roleId, 10),
      };
      endpoint = `/users/${userToEdit.id}`; //
      methodType = 'put'; // Используем метод apiService.put
    } else { //
      payload = { //
        username: username,
        email: email,
        full_name: fullName || null,
        password: password,
        role_id: parseInt(roleId, 10),
        is_active: isActive,
      };
      endpoint = '/users/'; //
      methodType = 'post'; // Используем метод apiService.post
    }

    try {
      if (methodType === 'put') {
        await apiService.put(endpoint, payload);
      } else {
        await apiService.post(endpoint, payload);
      }
      onSuccess(); //
    } catch (err) { //
      console.error(`UserForm: Ошибка при ${isEditMode ? 'обновлении' : 'создании'} пользователя:`, err); //
      if (err instanceof ApiError) {
        setError(err.message || `Ошибка ${isEditMode ? 'обновления' : 'создания'} пользователя.`);
      } else {
        setError(`Произошла неизвестная ошибка.`);
      }
    } finally {
      setIsLoading(false); //
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4"> {/* */}
      {/* Отображаем ошибку submit формы */}
      {error && <Alert type="error" message={error} className="mb-2" />}
      {/* Отображаем ошибку загрузки ролей */}
      {fetchRolesError && <Alert type="warning" title="Ошибка загрузки ролей" message={fetchRolesError} className="mb-2" />} {/* */}
      
      {isRolesLoading && <Loader message="Загрузка доступных ролей..." />}

      {/* Поля формы (username, email, etc.) остаются без изменений в JSX, кроме disabled состояния для селекта ролей */}
      <div>
        <label htmlFor="username-userform" className={commonLabelClasses}>Имя пользователя (логин)</label> {/* */}
        <input type="text" id="username-userform" value={username} onChange={(e) => setUsername(e.target.value)}
               required disabled={isEditMode}
               className={`${commonInputClasses} ${isEditMode ? 'bg-gray-100 cursor-not-allowed' : ''}`} /> {/* */}
      </div>

      <div>
        <label htmlFor="email-userform" className={commonLabelClasses}>Email</label> {/* */}
        <input type="email" id="email-userform" value={email} onChange={(e) => setEmail(e.target.value)}
               required className={commonInputClasses} /> {/* */}
      </div>

      <div>
        <label htmlFor="fullName-userform" className={commonLabelClasses}>Полное имя</label> {/* */}
        <input type="text" id="fullName-userform" value={fullName} onChange={(e) => setFullName(e.target.value)}
               className={commonInputClasses} /> {/* */}
      </div>

      {!isEditMode && ( //
        <>
          <div>
            <label htmlFor="password-userform" className={commonLabelClasses}>Пароль</label> {/* */}
            <input type="password" id="password-userform" value={password} onChange={(e) => setPassword(e.target.value)}
                   required={!isEditMode} className={commonInputClasses} /> {/* */}
          </div>
          <div>
            <label htmlFor="confirmPassword-userform" className={commonLabelClasses}>Подтвердите пароль</label> {/* */}
            <input type="password" id="confirmPassword-userform" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)}
                   required={!isEditMode} className={commonInputClasses} /> {/* */}
          </div>
        </>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center"> {/* */}
        <div>
            <label htmlFor="roleId-userform" className={commonLabelClasses}>Роль</label> {/* */}
            <select 
                id="roleId-userform" 
                value={roleId} 
                onChange={(e) => setRoleId(e.target.value)} 
                required 
                className={commonInputClasses}
                disabled={isRolesLoading || availableRoles.length === 0} // Блокируем, если роли грузятся или не загружены
            >
                <option value="" disabled>{isRolesLoading ? "Загрузка ролей..." : (availableRoles.length === 0 ? "Роли не найдены" : "-- Выберите роль --")}</option> {/* */}
                {availableRoles.map(role => ( //
                <option key={role.id} value={role.id}>{role.name}</option> //
                ))}
            </select>
        </div>
        <div className="pt-5"> {/* */}
            <div className="flex items-center"> {/* */}
                <input id="isActive-userform" name="isActive" type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)}
                    className="h-4 w-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"/> {/* */}
                <label htmlFor="isActive-userform" className="ml-2 block text-sm text-gray-900">Активен</label> {/* */}
            </div>
        </div>
      </div>

      <div className="pt-3 flex justify-end space-x-3"> {/* */}
        <Button variant="secondary" size="md" onClick={onCancel} disabled={isLoading}> {/* */}
          Отмена
        </Button>
        <Button type="submit" variant="primary" size="md" disabled={isLoading || isRolesLoading}> {/* Также блокируем, если роли грузятся */} {/* */}
          {isLoading ? 'Сохранение...' : (isEditMode ? 'Сохранить изменения' : 'Создать пользователя')} {/* */}
        </Button>
      </div>
    </form>
  );
};

export default UserForm; //