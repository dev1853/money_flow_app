// frontend/src/pages/RegisterPage.jsx
// Компонент страницы регистрации
// Этот компонент позволяет пользователям создавать новый аккаунт

import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { apiService } from '../services/apiService';
import Alert from '../components/Alert';
import Button from '../components/Button';
import Input from '../components/forms/Input';
import Label from '../components/forms/Label';


const RegisterPage = () => {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuth();s

  // --- ШАГ 2: Добавляем универсальный обработчик изменений ---
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('Пароли не совпадают.');
      return;
    }
    if (password.length < 6) {
        setError('Пароль должен содержать не менее 6 символов.');
        return;
    }

    setLoading(true);
    try {
      // Создаем пользователя
      await apiService.post('/users/', {
        username: formData.username,
        email: formData.email,
        password: formData.password,
      });

      // Сразу после успешной регистрации логиним пользователя
      await login(formData.email, formData.password);
      
    } catch (err) {
      console.error("Ошибка регистрации:", err);
      setError(err.message || 'Не удалось зарегистрироваться. Попробуйте другой email или имя пользователя.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50">
      <div className="w-full max-w-md p-8 space-y-6 bg-white shadow-lg rounded-xl">
        <h2 className="text-3xl font-bold text-center text-gray-800">Создать аккаунт</h2>
        <form onSubmit={handleSubmit} className="space-y-6">
          {error && <Alert type="error">{error}</Alert>}
          <Input
            label="Имя пользователя"
            id="username"
            name="username"
            type="text"
            value={formData.username}
            onChange={handleChange} // <-- Теперь эта функция определена
            required
          />
          <Input
            label="Email"
            id="email"
            name="email"
            type="email"
            value={formData.email}
            onChange={handleChange} // <-- Теперь эта функция определена
            required
          />
          <Input
            label="Пароль"
            id="password"
            name="password"
            type="password"
            value={formData.password}
            onChange={handleChange} // <-- Теперь эта функция определена
            required
          />
          <Input
            label="Подтвердите пароль"
            id="confirmPassword"
            name="confirmPassword"
            type="password"
            value={formData.confirmPassword}
            onChange={handleChange} // <-- Теперь эта функция определена
            required
          />
          <div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Регистрация...' : 'Зарегистрироваться'}
            </Button>
          </div>
        </form>
        <p className="text-sm text-center text-gray-600">
          Уже есть аккаунт?{' '}
          <Link to="/login" className="font-medium text-indigo-600 hover:text-indigo-500">
            Войти
          </Link>
        </p>
      </div>
    </div>
  );
}

export default RegisterPage;