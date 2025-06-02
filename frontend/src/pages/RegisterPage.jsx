// src/pages/RegisterPage.jsx
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { LockClosedIcon, UserCircleIcon, EnvelopeIcon, IdentificationIcon } from '@heroicons/react/24/outline'; // Используем outline для консистентности

const RegisterPage = () => {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [fullName, setFullName] = useState('');
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
    if (password.length < 6) { // Пример простой валидации пароля
        setError('Пароль должен содержать не менее 6 символов.');
        return;
    }

    setIsLoading(true);

    try {
      const response = await fetch('http://localhost:8000/users/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
            username, 
            email, 
            password, 
            full_name: fullName || null, 
            // role_id и is_active будут установлены по умолчанию на бэкенде
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || `Ошибка регистрации: ${response.status}`);
      }
      
      setSuccessMessage('Регистрация прошла успешно! Теперь вы можете войти.');
      // Опционально: автоматический редирект на страницу входа через несколько секунд
      setTimeout(() => {
        navigate('/login');
      }, 3000);

    } catch (err) {
      setError(err.message);
      console.error("RegisterPage: Ошибка регистрации:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const commonInputDivClasses = "relative";
  const commonInputClasses = "block w-full rounded-md border-0 py-2.5 pl-10 pr-3 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6";
  const commonIconClasses = "pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3";


  return (
    <>
      {/* Заголовок и логотип можно будет вынести в AuthLayout */}
      {/* <div className="sm:mx-auto sm:w-full sm:max-w-md mb-8">
        <h2 className="text-center text-3xl font-bold tracking-tight text-indigo-600">
          Регистрация
        </h2>
      </div> */}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label htmlFor="username-reg" className="block text-sm font-medium leading-6 text-gray-900">
            Имя пользователя (логин)
          </label>
          <div className={commonInputDivClasses}>
            <div className={commonIconClasses}><UserCircleIcon className="h-5 w-5 text-gray-400" /></div>
            <input id="username-reg" name="username" type="text" autoComplete="username" required value={username} onChange={(e) => setUsername(e.target.value)} className={commonInputClasses} placeholder="my_username"/>
          </div>
        </div>

        <div>
          <label htmlFor="email-reg" className="block text-sm font-medium leading-6 text-gray-900">
            Email адрес
          </label>
          <div className={commonInputDivClasses}>
            <div className={commonIconClasses}><EnvelopeIcon className="h-5 w-5 text-gray-400" /></div>
            <input id="email-reg" name="email" type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} className={commonInputClasses} placeholder="you@example.com"/>
          </div>
        </div>

        <div>
          <label htmlFor="fullName-reg" className="block text-sm font-medium leading-6 text-gray-900">
            Полное имя <span className="text-xs text-gray-500">(необязательно)</span>
          </label>
          <div className={commonInputDivClasses}>
            <div className={commonIconClasses}><IdentificationIcon className="h-5 w-5 text-gray-400" /></div>
            <input id="fullName-reg" name="fullName" type="text" value={fullName} onChange={(e) => setFullName(e.target.value)} className={commonInputClasses} placeholder="Иван Иванов"/>
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
          <div className="rounded-md bg-red-50 p-3">
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}
        {successMessage && (
          <div className="rounded-md bg-green-50 p-3">
            <p className="text-sm text-green-700">{successMessage}</p>
          </div>
        )}

        <div>
          <button
            type="submit"
            disabled={isLoading}
            className="flex w-full justify-center rounded-md bg-indigo-600 px-3 py-2.5 text-sm font-semibold leading-6 text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 disabled:opacity-75"
          >
            {isLoading ? 'Регистрация...' : 'Зарегистрироваться'}
          </button>
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