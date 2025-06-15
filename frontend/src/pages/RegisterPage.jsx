// frontend/src/pages/RegisterPage.jsx
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { LockClosedIcon, EnvelopeIcon, UserCircleIcon } from '@heroicons/react/24/outline';
import Button from '../components/Button';
import Alert from '../components/Alert';
import { apiService, ApiError } from '../services/apiService';

const RegisterPage = () => {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);

    if (password !== confirmPassword) {
      setError('Пароли не совпадают.');
      return;
    }
    if (password.length < 6) {
        setError('Пароль должен содержать не менее 6 символов.');
        return;
    }

    setIsLoading(true);

    try {
      // ================== ГЛАВНОЕ ИЗМЕНЕНИЕ ЗДЕСЬ ==================
      // Убран префикс /api. Теперь путь правильный: /users/
      await apiService.post('/users', {
          email,
          username,
          password
      });
      // =============================================================

      setSuccessMessage('Регистрация прошла успешно! Сейчас вы будете перенаправлены на страницу входа.');
      
      setTimeout(() => {
        navigate('/login');
      }, 3000);

    } catch (err) {
      console.error(err);
      if (err instanceof ApiError) {
          setError(err.message || 'Произошла ошибка при регистрации.');
      } else {
          setError('Произошла неизвестная ошибка.');
      }
    } finally {
        setIsLoading(false);
    }
  };

  const commonInputClasses = "block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6 pl-10";
  const commonInputDivClasses = "relative mt-2 rounded-md shadow-sm";
  const commonIconClasses = "pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3";

  return (
    <>
      <div>
        <h2 className="mt-6 text-center text-2xl font-bold leading-9 tracking-tight text-gray-900">
          Создание нового аккаунта
        </h2>
      </div>

      <form onSubmit={handleSubmit} className="mt-8 space-y-6">
        <div>
          <label htmlFor="email-reg" className="block text-sm font-medium leading-6 text-gray-900">
            Email
          </label>
          <div className={commonInputDivClasses}>
            <div className={commonIconClasses}><EnvelopeIcon className="h-5 w-5 text-gray-400" /></div>
            <input id="email-reg" name="email" type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} className={commonInputClasses} placeholder="you@example.com"/>
          </div>
        </div>
        <div>
          <label htmlFor="username-reg" className="block text-sm font-medium leading-6 text-gray-900">
            Имя пользователя
          </label>
          <div className={commonInputDivClasses}>
            <div className={commonIconClasses}><UserCircleIcon className="h-5 w-5 text-gray-400" /></div>
            <input 
              id="username-reg" 
              name="username" 
              type="text" 
              autoComplete="username" 
              required 
              value={username} 
              onChange={(e) => setUsername(e.target.value)} 
              className={commonInputClasses} 
              placeholder="yourusername"
            />
          </div>
        </div>
        
        <div>
          <label htmlFor="password-reg" className="block text-sm font-medium leading-6 text-gray-900">
            Пароль
          </label>
          <div className={commonInputDivClasses}>
            <div className={commonIconClasses}><LockClosedIcon className="h-5 w-5 text-gray-400" /></div>
            <input id="password-reg" name="password" type="password" required value={password} onChange={(e) => setPassword(e.target.value)} className={commonInputClasses} placeholder="••••••••"/>
          </div>
        </div>

        <div>
          <label htmlFor="confirmPassword-reg" className="block text-sm font-medium leading-6 text-gray-900">
            Подтвердите пароль
          </label>
          <div className={commonInputDivClasses}>
            <div className={commonIconClasses}><LockClosedIcon className="h-5 w-5 text-gray-400" /></div>
            <input id="confirmPassword-reg" name="confirmPassword" type="password" required value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className={commonInputClasses} placeholder="••••••••"/>
          </div>
        </div>

        {error && (
          <Alert type="error" message={error} />
        )}
        {successMessage && (
          <Alert type="success" message={successMessage} />
        )}

        <div>
          <Button
            type="submit"
            variant="primary"
            size="md"
            disabled={isLoading || successMessage}
            fullWidth
          >
            {isLoading ? 'Регистрация...' : 'Зарегистрироваться'}
          </Button>
        </div>
      </form>

      <p className="mt-8 text-center text-sm text-gray-500">
        Уже есть аккаунт?{' '}
        <Link to="/login" className="font-semibold leading-6 text-indigo-600 hover:text-indigo-500">
          Войти
        </Link>
      </p>
    </>
  );
};

export default RegisterPage;