// frontend/src/components/admin/UserForm.jsx
import React, { useState, useEffect, useCallback } from 'react';
import Button from '../Button';
import { apiService, ApiError } from '../../services/apiService';
import Loader from '../Loader';
import Input from '../forms/Input';
import Label from '../forms/Label';
import Select from '../forms/Select';


const UserForm = ({ userToEdit, onSuccess, onCancel }) => {
  const isEditMode = Boolean(userToEdit);

  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [fullName, setFullName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [roleId, setRoleId] = useState('');
  const [isActive, setIsActive] = useState(true);

  const [availableRoles, setAvailableRoles] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isRolesLoading, setIsRolesLoading] = useState(false);
  const [error, setError] = useState(null);
  const [fetchRolesError, setFetchRolesError] = useState(null);

  const fetchRoles = useCallback(async () => {
    setIsRolesLoading(true);
    setFetchRolesError(null);
    try {
      const data = await apiService.get('/roles/?limit=100');
      setAvailableRoles(data);
      if (!isEditMode && data.length > 0) {
        const employeeRole = data.find(r => r.name === 'employee');
        if (employeeRole) setRoleId(employeeRole.id.toString());
        else if (data.length > 0) setRoleId(data[0].id.toString());
      }
    } catch (err) {
      console.error("UserForm: Ошибка загрузки ролей:", err);
      if (err instanceof ApiError) {
        setFetchRolesError(err.message || "Не удалось загрузить роли.");
      } else {
        setFetchRolesError("Произошла неизвестная ошибка при загрузке ролей.");
      }
    } finally {
      setIsRolesLoading(false);
    }
  }, [isEditMode]);

  useEffect(() => {
    fetchRoles();
  }, [fetchRoles]);

  useEffect(() => {
    if (isEditMode && userToEdit) {
      setUsername(userToEdit.username || '');
      setEmail(userToEdit.email || '');
      setFullName(userToEdit.full_name || '');
      setPassword('');
      setConfirmPassword('');
      setIsActive(userToEdit.is_active);
      if (availableRoles.length > 0 && userToEdit.role_id) {
        setRoleId(userToEdit.role_id.toString());
      }
    } else {
      setUsername('');
      setEmail('');
      setFullName('');
      setPassword('');
      setConfirmPassword('');
      setIsActive(true);
      if (availableRoles.length > 0) {
        const employeeRole = availableRoles.find(r => r.name === 'employee');
        if (employeeRole) setRoleId(employeeRole.id.toString());
        else setRoleId(availableRoles[0].id.toString());
      } else {
        setRoleId('');
      }
    }
  }, [isEditMode, userToEdit, availableRoles]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    if (!isEditMode && password !== confirmPassword) {
      setError("Пароли не совпадают.");
      setIsLoading(false);
      return;
    }
    if (!isEditMode && password.length < 6) {
        setError("Пароль должен содержать не менее 6 символов.");
        setIsLoading(false);
        return;
    }
    if (!roleId) {
      setError("Пожалуйста, выберите роль.");
      setIsLoading(false);
      return;
    }

    let payload;
    let endpoint;
    let methodType;

    if (isEditMode) {
      payload = {
        email: email,
        full_name: fullName || null,
        is_active: isActive,
        role_id: parseInt(roleId, 10),
      };
      endpoint = `/users/${userToEdit.id}`;
      methodType = 'put';
    } else {
      payload = {
        username: username,
        email: email,
        full_name: fullName || null,
        password: password,
        role_id: parseInt(roleId, 10),
        is_active: isActive,
      };
      endpoint = '/users/';
      methodType = 'post';
    }

    try {
      if (methodType === 'put') {
        await apiService.put(endpoint, payload);
      } else {
        await apiService.post(endpoint, payload);
      }
      onSuccess();
    } catch (err) {
      console.error(`UserForm: Ошибка при ${isEditMode ? 'обновлении' : 'создании'} пользователя:`, err);
      if (err instanceof ApiError) {
        setError(err.message || `Ошибка ${isEditMode ? 'обновления' : 'создания'} пользователя.`);
      } else {
        setError(`Произошла неизвестная ошибка.`);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && <Alert type="error" message={error} className="mb-2" />}
      {fetchRolesError && <Alert type="warning" title="Ошибка загрузки ролей" message={fetchRolesError} className="mb-2" />}
      
      {isRolesLoading && <Loader message="Загрузка доступных ролей..." />}

      {!isRolesLoading && (
        <>
          <div>
            <Label htmlFor="username-userform">Имя пользователя (логин)</Label>
            <Input
              type="text"
              id="username-userform"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              disabled={isEditMode}
              className={isEditMode ? 'bg-gray-100 cursor-not-allowed' : ''} // Оставляем специфичные классы
            />
          </div>

          <div>
            <Label htmlFor="email-userform">Email</Label>
            <Input type="email" id="email-userform" value={email} onChange={(e) => setEmail(e.target.value)} required /> {/* Убраны дублирующиеся классы */}
          </div>

          <div>
            <Label htmlFor="fullName-userform">Полное имя</Label>
            <Input type="text" id="fullName-userform" value={fullName} onChange={(e) => setFullName(e.target.value)} /> {/* Убраны дублирующиеся классы */}
          </div>

          {!isEditMode && (
            <>
              <div>
                <Label htmlFor="password-userform">Пароль</Label>
                <Input type="password" id="password-userform" value={password} onChange={(e) => setPassword(e.target.value)} required={!isEditMode} /> {/* Убраны дублирующиеся классы */}
              </div>
              <div>
                <Label htmlFor="confirmPassword-userform">Подтвердите пароль</Label>
                <Input type="password" id="confirmPassword-userform" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required={!isEditMode} /> {/* Убраны дублирующиеся классы */}
              </div>
            </>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center">
            <div>
                <Label htmlFor="roleId-userform">Роль</Label>
                <Select
                    id="roleId-userform"
                    value={roleId}
                    onChange={(e) => setRoleId(e.target.value)}
                    required
                    disabled={availableRoles.length === 0}
                    // Убраны дублирующиеся классы
                >
                    <option value="" disabled>{availableRoles.length === 0 ? "Роли не найдены" : "-- Выберите роль --"}</option>
                    {availableRoles.map(role => (
                        <option key={role.id} value={role.id}>{role.name}</option>
                    ))}
                </Select>
            </div>
            <div className="pt-5">
                <div className="flex items-center">
                    {/* Для checkbox оставляем input */}
                    <input id="isActive-userform" name="isActive" type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)}
                        className="h-4 w-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"/>
                    <Label htmlFor="isActive-userform" className="ml-2">Активен</Label>
                </div>
            </div>
          </div>

          <div className="pt-3 flex justify-end space-x-3">
            <Button variant="secondary" size="md" onClick={onCancel} disabled={isLoading}>
              Отмена
            </Button>
            <Button type="submit" variant="primary" size="md" disabled={isLoading}>
              {isLoading ? 'Сохранение...' : (isEditMode ? 'Сохранить изменения' : 'Создать пользователя')}
            </Button>
          </div>
        </>
      )}
    </form>
  );
};

export default UserForm;