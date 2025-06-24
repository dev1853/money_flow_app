// frontend/src/pages/LoginPage.jsx

import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate, useLocation, Link } from 'react-router-dom';

import Button from '../components/Button';
import Alert from '../components/Alert';
import Input from '../components/forms/Input';
import Label from '../components/forms/Label';
import { ArrowTrendingUpIcon } from '@heroicons/react/24/outline';


function LoginPage() {
  const [email, setEmail] = useState(''); // Переименовали для ясности
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);

  // Получаем функцию login и состояние isLoading из нашего AuthContext
  const { login, isLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Определяем, куда перенаправить пользователя после успешного входа
  const from = location.state?.from?.pathname || "/dashboard";

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    try {
      // Ваша функция login ожидает email и пароль
      await login(email, password);
      navigate(from, { replace: true });
    } catch (err) {
      setError(err.message || 'Не удалось войти. Проверьте введенные данные.');
      console.error('Ошибка входа на LoginPage:', err);
    }
  };

  return (
    <>
      {/* Эта обертка реализует новый дизайн, 
        теперь AuthLayout.jsx не нужен для стилизации этой страницы.
      */}
      <div className="flex min-h-full flex-1 flex-col justify-center px-6 py-12 lg:px-8">
        <div className="sm:mx-auto sm:w-full sm:max-w-sm">
          <h2 className="mt-10 text-center text-2xl font-bold leading-9 tracking-tight text-gray-900">
            Вход в ваш аккаунт
          </h2>
        </div>

        <div className="mt-10 sm:mx-auto sm:w-full sm:max-w-sm">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <Label htmlFor="email">
                Email
              </Label>
              <div className="mt-2">
                <Input
                  id="email"
                  name="email"
                  type="email"
                  required
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="block w-full" // Дополнительные стили, если нужны
                />
              </div>
            </div>

            <div>
              <Label htmlFor="password">
                Пароль
              </Label>
              <div className="mt-2">
                <Input
                  id="password"
                  name="password"
                  type="password"
                  required
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="block w-full"
                />
              </div>
            </div>

            {/* Отображаем ошибку, если она есть */}
            {error && (
              <Alert type="error" message={error} />
            )}

            <div>
              <Button
                type="submit"
                variant="primary"
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
      </div>
    </>
  );
}

export default LoginPage;