// frontend/src/pages/RegisterPage.jsx
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { LockClosedIcon, EnvelopeIcon, UserCircleIcon } from '@heroicons/react/24/outline';
import Button from '../components/Button';
import Alert from '../components/Alert';
import { apiService, ApiError } from '../services/apiService';
import Input from '../components/forms/Input'; // Используем наш Input
import Label from '../components/forms/Label'; // Используем наш Label


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
      await apiService.post('/users', {
          email,
          username,
          password
      });

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
          <Label htmlFor="email-reg">
            Email
          </Label>
          <div className={commonInputDivClasses}>
            <div className={commonIconClasses}><EnvelopeIcon className="h-5 w-5 text-gray-400" /></div>
            <Input id="email-reg" name="email" type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" /* className="pl-10" УДАЛЯЕМ */ />
          </div>
        </div>
        <div>
          <Label htmlFor="username-reg">
            Имя пользователя
          </Label>
          <div className={commonInputDivClasses}>
            <div className={commonIconClasses}><UserCircleIcon className="h-5 w-5 text-gray-400" /></div>
            <Input 
              id="username-reg" 
              name="username" 
              type="text" 
              autoComplete="username" 
              required 
              value={username} 
              onChange={(e) => setUsername(e.target.value)} 
              placeholder="yourusername"
              /* className="pl-10" УДАЛЯЕМ */
            />
          </div>
        </div>
        
        <div>
          <Label htmlFor="password-reg">
            Пароль
          </Label>
          <div className={commonInputDivClasses}>
            <div className={commonIconClasses}><LockClosedIcon className="h-5 w-5 text-gray-400" /></div>
            <Input id="password-reg" name="password" type="password" required value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" /* className="pl-10" УДАЛЯЕМ */ />
          </div>
        </div>

        <div>
          <Label htmlFor="confirmPassword-reg">
            Подтвердите пароль
          </Label>
          <div className={commonInputDivClasses}>
            <div className={commonIconClasses}><LockClosedIcon className="h-5 w-5 text-gray-400" /></div>
            <Input id="confirmPassword-reg" name="confirmPassword" type="password" required value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="••••••••" /* className="pl-10" УДАЛЯЕМ */ />
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