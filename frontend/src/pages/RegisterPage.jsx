// frontend/src/pages/RegisterPage.jsx
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import AuthLayout from '../layouts/AuthLayout';
import InputField from '../components/forms/InputField';
import Button from '../components/Button';
import Alert from '../components/Alert';
import { apiService, ApiError } from '../services/apiService';

const RegisterPage = () => {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    fullName: '',
  });
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);

    if (formData.password !== formData.confirmPassword) {
      setError('Пароли не совпадают.');
      return;
    }

    setIsLoading(true);
    try {
      // ИСПРАВЛЕНИЕ: Собираем данные из существующих переменных состояния
      const payload = {
        email: email,
        username: username,
        password: password,
      };
      
      await apiService.post('/users/', payload);

      setSuccessMessage('Регистрация прошла успешно! Сейчас вы будете перенаправлены на страницу входа.');
      setTimeout(() => navigate('/login'), 3000);
    } catch (err) {
      console.error('Ошибка регистрации:', err);
      if (err instanceof ApiError) {
          setError(err.message);
      } else {
          setError('Произошла ошибка при регистрации.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Общие классы для стилей
  const commonInputDivClasses = "relative mt-2 rounded-md shadow-sm";
  const commonIconClasses = "pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3";


  return (
    <AuthLayout title="Создайте новый аккаунт">
      <form className="space-y-6" onSubmit={handleSubmit}>
        <InputField
          id="fullName"
          label="Полное имя"
          name="fullName"
          type="text"
          required
          value={formData.fullName}
          onChange={handleChange}
        />
        <InputField
          id="username"
          label="Имя пользователя"
          name="username"
          type="text"
          required
          value={formData.username}
          onChange={handleChange}
        />
        <InputField
          id="email"
          label="Email"
          name="email"
          type="email"
          required
          value={formData.email}
          onChange={handleChange}
        />
        <InputField
          id="password"
          label="Пароль"
          name="password"
          type="password"
          required
          value={formData.password}
          onChange={handleChange}
        />
        <InputField
          id="confirmPassword"
          label="Подтвердите пароль"
          name="confirmPassword"
          type="password"
          required
          value={formData.confirmPassword}
          onChange={handleChange}
        />
        
        {error && <Alert type="error" message={error} />}
        {successMessage && <Alert type="success" message={successMessage} />}

        <div>
          <Button type="submit" disabled={isLoading || successMessage} fullWidth>
            {isLoading ? 'Регистрация...' : 'Зарегистрироваться'}
          </Button>
        </div>
      </form>

      <p className="mt-10 text-center text-sm text-gray-500">
        Уже есть аккаунт?{' '}
        <Link to="/login" className="font-semibold leading-6 text-indigo-600 hover:text-indigo-500">
          Войти
        </Link>
      </p>
    </AuthLayout>
  );
};

export default RegisterPage;