// frontend/src/pages/RegisterPage.jsx
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { apiService } from '../services/apiService';
import { useApiMutation } from '../hooks/useApiMutation';

// Ваши кастомные компоненты
import Alert from '../components/Alert';
import Button from '../components/Button';
import Input from '../components/forms/Input';
import Label from '../components/forms/Label';

function RegisterPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [formData, setFormData] = useState({
    username: '', email: '', password: '', confirmPassword: ''
  });
  const { login } = useAuth();
  const navigate = useNavigate();
  const [passwordsError, setPasswordsError] = useState('');

  const [handleRegister, isLoading, registerError] = useApiMutation(
    (data) => apiService.register({
      username: data.username,
      email: data.email,
      password: data.password,
    }), 
    {
      onSuccess: async () => {
        await login(formData.email, formData.password);
        navigate('/dashboard');
      }
    }
  );

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
        e.preventDefault();

        // --- ИСПРАВЛЕНИЕ: Добавляем клиентскую валидацию ---
        if (password.length < 8) {
            setFormError('Пароль должен содержать не менее 8 символов.');
            return; // Прерываем отправку формы
        }
        if (!email.includes('@')) {
            setFormError('Пожалуйста, введите корректный email.');
            return;
        }

        // Если валидация пройдена, сбрасываем ошибку и отправляем данные
        setFormError('');
        const userData = { email, password, username: email }; // Отправляем email как username
        registerMutation.mutate(userData);
    };

  const error = registerError || passwordsError;

  return (
    <div className="flex min-h-full flex-1 flex-col justify-center">
      <div className="sm:mx-auto sm:w-full sm:max-w-sm">
        <h2 className="mt-10 text-center text-xl font-bold leading-9 tracking-tight text-gray-900">
          Регистрация нового аккаунта
        </h2>
      </div>

      <div className="mt-10 sm:mx-auto sm:w-full sm:max-w-sm">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <Label htmlFor="username">Имя пользователя</Label>
            <div className="mt-2">
              <Input
                id="username"
                name="username"
                type="text"
                required
                autoComplete="username"
                value={formData.username}
                onChange={handleChange}
                placeholder="Ваше имя пользователя"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="email">Email адрес</Label>
            <div className="mt-2">
              <Input
                id="email"
                name="email"
                type="email"
                required
                autoComplete="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="you@example.com"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="password">Пароль</Label>
            <div className="mt-2">
              <Input
                id="password"
                name="password"
                type="password"
                required
                autoComplete="new-password"
                value={formData.password}
                onChange={handleChange}
                placeholder="••••••••"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="confirmPassword">Подтвердите пароль</Label>
            <div className="mt-2">
              <Input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                required
                autoComplete="new-password"
                value={formData.confirmPassword}
                onChange={handleChange}
                placeholder="••••••••"
              />
            </div>
          </div>

          {error && <Alert type="error" message={error} />}

          <div>
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? 'Создание аккаунта...' : 'Зарегистрироваться'}
            </Button>
          </div>
        </form>

        <p className="mt-10 text-center text-sm text-gray-500">
          Уже есть аккаунт?{' '}
          <Link to="/login" className="font-semibold leading-6 text-indigo-600 hover:text-indigo-500">
            Войти
          </Link>
        </p>
      </div>
    </div>
  );
}

export default RegisterPage;