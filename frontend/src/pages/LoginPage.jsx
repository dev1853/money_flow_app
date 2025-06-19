// frontend/src/pages/LoginPage.jsx
import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate, useLocation, Link } from 'react-router-dom';

import Button from '../components/Button';
import Alert from '../components/Alert';
import { UserCircleIcon, LockClosedIcon } from '@heroicons/react/24/outline';
import Input from '../components/forms/Input'; 
import Label from '../components/forms/Label'; 


function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);

  const { login, isLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const from = location.state?.from?.pathname || "/";

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    try {
      await login(username, password);
      navigate(from, { replace: true });
    } catch (err) {
      setError(err.message || 'Не удалось войти. Проверьте введенные данные.');
      console.error('Ошибка входа на LoginPage:', err);
    }
  };

  const commonInputDivClasses = "relative mt-2 rounded-md shadow-sm";
  const commonIconClasses = "pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3";

  return (
    <>
      <div className="sm:mx-auto sm:w-full sm:max-w-sm">
        <h2 className="mt-8 text-center text-2xl font-bold leading-9 tracking-tight text-gray-900">
          Вход в систему
        </h2>
      </div>

      <div className="mt-10 sm:mx-auto sm:w-full sm:max-w-sm">
        <form className="space-y-6" onSubmit={handleSubmit}>
          <div>
            <Label htmlFor="username-login">
              Имя пользователя
            </Label>
            <div className={commonInputDivClasses}>
              <div className={commonIconClasses}>
                <UserCircleIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
              </div>
              <Input
                id="username-login"
                name="username"
                type="text"
                autoComplete="username"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Ваш логин"
                className="pl-10"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="password-login">
              Пароль
            </Label>
            <div className={commonInputDivClasses}>
              <div className={commonIconClasses}>
                <LockClosedIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
              </div>
              <Input
                id="password-login"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="pl-10"
              />
            </div>
          </div>

          {error && (
            <Alert type="error" message={error} />
          )}

          <div>
            <Button
              type="submit"
              variant="primary"
              size="md"
              disabled={isLoading}
              fullWidth
            >
              {isLoading ? 'Вход...' : 'Войти'}
            </Button>
          </div>
        </form>
        <p className="mt-10 text-center text-sm text-gray-500">
          Нет аккаунта?{' '}
          <Link to="/register" className="font-semibold leading-6 text-indigo-600 hover:text-indigo-500">
            Зарегистрироваться
          </Link>
        </p>
      </div>
    </>
  );
}

export default LoginPage;