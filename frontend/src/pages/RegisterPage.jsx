// frontend/src/pages/RegisterPage.jsx
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { LockClosedIcon, EnvelopeIcon, UserCircleIcon } from '@heroicons/react/24/outline';
import Button from '../components/Button';
import Alert from '../components/Alert';
import { apiService, ApiError } from '../services/apiService'; // Убедись, что импортируешь apiService
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
      // КЛЮЧЕВОЕ ИЗМЕНЕНИЕ: Передаем false в качестве последнего аргумента,
      // чтобы ОТКЛЮЧИТЬ отправку токена авторизации для этого запроса.
      await apiService.post('/auth/register/', {
          email,
          username,
          password
      }, {}, false); // <--- Вот здесь изменили: добавлен {}, false
      // Первый {} - это options, второй false - это authenticate.

      setSuccessMessage('Регистрация прошла успешно! Сейчас вы будете перенаправлены на страницу входа.');
      setTimeout(() => {
        navigate('/login');
      }, 3000); // Перенаправить через 3 секунды
    } catch (err) {
        console.error('Ошибка регистрации:', err);
        if (err instanceof ApiError) {
            setError(err.message);
        } else {
            setError('Произошла ошибка при регистрации. Пожалуйста, попробуйте еще раз.');
        }
    } finally {
      setIsLoading(false);
    }
  };

  const commonInputDivClasses = "relative mt-2 rounded-md shadow-sm";
  const commonIconClasses = "pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3";


  return (
    <div className="flex min-h-full flex-1 flex-col justify-center px-6 py-12 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h2 className="mt-10 text-center text-2xl font-bold leading-9 tracking-tight text-gray-900">
          Зарегистрируйте новый аккаунт
        </h2>
      </div>

      <div className="mt-10 sm:mx-auto sm:w-full sm:max-w-md">
        <form className="space-y-6" onSubmit={handleSubmit}>
          <div>
            <Label htmlFor="username-reg">
              Имя пользователя
            </Label>
            <div className={commonInputDivClasses}>
              <div className={commonIconClasses}><UserCircleIcon className="h-5 w-5 text-gray-400" /></div>
              <Input id="username-reg" name="username" type="text" autoComplete="username" required value={username} onChange={(e) => setUsername(e.target.value)} placeholder="Ваше имя пользователя" className="pl-10" />
            </div>
          </div>

          <div>
            <Label htmlFor="email-reg">
              Адрес электронной почты
            </Label>
            <div className={commonInputDivClasses}>
              <div className={commonIconClasses}><EnvelopeIcon className="h-5 w-5 text-gray-400" /></div>
              <Input id="email-reg" name="email" type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" className="pl-10"/>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between">
              <Label htmlFor="password-reg">
                Пароль
              </Label>
            </div>
            <div className={commonInputDivClasses}>
              <div className={commonIconClasses}><LockClosedIcon className="h-5 w-5 text-gray-400" /></div>
              <Input id="password-reg" name="password" type="password" required value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" className="pl-10" />
            </div>
          </div>

          <div>
            <Label htmlFor="confirmPassword-reg">
              Подтвердите пароль
            </Label>
            <div className={commonInputDivClasses}>
              <div className={commonIconClasses}><LockClosedIcon className="h-5 w-5 text-gray-400" /></div>
              <Input id="confirmPassword-reg" name="confirmPassword" type="password" required value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="••••••••" className="pl-10"/>
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
      </div>
    </div>
  );
};

export default RegisterPage;