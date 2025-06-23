// frontend/src/components/forms/WorkspaceForm.jsx
import React, { useState } from 'react';
import Button from '../Button';
import Input from './Input';
import Label from './Label';
import Alert from '../Alert';
import { apiService } from '../../services/apiService';
import { useAuth } from '../../contexts/AuthContext';

const WorkspaceForm = ({ onSuccess, onCancel, existingWorkspace = null }) => {
  const [formData, setFormData] = useState({
    name: existingWorkspace ? existingWorkspace.name : '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { user } = useAuth();

  const handleChange = (e) => {
    setFormData({ ...formData, name: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (!formData.name) {
      setError("Пожалуйста, введите название компании.");
      setLoading(false);
      return;
    }

    if (!user || !user.id) {
        setError("Пользователь не авторизован или его ID недоступен.");
        setLoading(false);
        return;
    }

    try {
      if (existingWorkspace) {
        setError("Обновление рабочих пространств пока не реализовано.");
        setLoading(false);
        return;
      } else {
        const dataToSubmit = {
          name: formData.name,
          owner_id: user.id,
        };
        const newWorkspace = await apiService.post('/workspaces/', dataToSubmit);
        console.log("Новое рабочее пространство создано:", newWorkspace);
        onSuccess(newWorkspace);
      }
    } catch (err) {
      setError(err.message || "Не удалось сохранить компанию.");
      console.error("Ошибка сохранения компании:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 px-4 py-5 sm:p-6 bg-white rounded-lg shadow-sm"> {/* ИЗМЕНЕНО: Отступы, фон, тень */}
      <div className="mb-4">
        <h3 className="text-lg leading-6 font-medium text-gray-900">Добавить новую компанию</h3> {/* НОВЫЙ ЗАГОЛОВОК */}
        <p className="mt-1 text-sm text-gray-500">
          Создайте новое рабочее пространство для разделения финансовых данных.
        </p>
      </div>

      {error && <Alert type="error" className="mb-4">{error}</Alert>} {/* Добавлен mb-4 */}
      
      <div>
        <Label htmlFor="name">Название компании</Label>
        <Input
          type="text"
          id="name"
          name="name"
          value={formData.name}
          onChange={handleChange}
          placeholder="Например, 'Мой Бизнес'"
          required
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm" // ИЗМЕНЕНО: Стиль Input
        />
      </div>
      <div className="flex justify-end pt-4">
        {onCancel && (
          <Button type="button" onClick={onCancel} variant="secondary" className="mr-2">Отмена</Button>
        )}
        <Button type="submit" disabled={loading}>
          {loading ? 'Сохранение...' : 'Создать'}
        </Button>
      </div>
    </form>
  );
};

export default WorkspaceForm;