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
  const [formData, setFormData] = useState({
    username: '', 
    email: '', 
    password: '', 
    confirmPassword: ''
  });
  const { login } = useAuth();
  const navigate = useNavigate();
  const [formError, setFormError] = useState(''); 

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
      },
      onError: (err) => {
        console.error("Mutation error caught in RegisterPage:", err); 
      }
    }
  );

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setFormError(''); 
  };

  const handleSubmit = async (e) => {
        e.preventDefault();

        if (formData.password.length < 8) {
            setFormError('Пароль должен содержать не менее 8 символов.');
            return; 
        }
        if (!formData.email.includes('@')) {
            setFormError('Пожалуйста, введите корректный email.');
            return;
        }
        if (formData.password !== formData.confirmPassword) {
            setFormError('Пароли не совпадают.');
            return;
        }

        setFormError('');
        handleRegister(formData); 
    };

  let errorMessage = formError; // Сначала проверяем локальную ошибку формы
  if (!errorMessage && registerError) { // Если локальной ошибки нет, но есть ошибка от API
    if (registerError instanceof Error) { // Проверяем, является ли это объектом ошибки
      errorMessage = registerError.message;
      if (registerError.details) { // Если есть дополнительные детали валидации (из ApiError)
        errorMessage += ` (${registerError.details})`;
      }
    } else {
      // На случай, если registerError по какой-то причине не объект Error, преобразуем в строку
      errorMessage = String(registerError); 
    }
  }

  return (
    <div className="flex min-h-full flex-1 flex-col justify-center">
      <div className="sm:mx-auto sm:w-full sm:max-w-sm">
        <h2 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-gray-100">
          Создание аккаунта
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

          {errorMessage && <Alert type="error" message={errorMessage} />}

          <div>
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? 'Создание аккаунта...' : 'Зарегистрироваться'}
            </Button>
          </div>
        </form>

        <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
          Уже есть аккаунт?{' '}
          <Link to="/login" className="font-medium text-indigo-600 hover:text-indigo-500 dark:text-indigo-400 dark:hover:text-indigo-300">
            Войти
          </Link>
        </p>
      </div>
    </div>
  );
}

export default RegisterPage;