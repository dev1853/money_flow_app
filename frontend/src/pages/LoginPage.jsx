// src/pages/LoginPage.jsx
import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate, useLocation, Link } from 'react-router-dom'; // Добавляем useLocation

function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  
  const { login, isLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation(); // <-- Получаем location

  // Определяем, куда перенаправить пользователя после входа
  const from = location.state?.from?.pathname || "/"; // По умолчанию на главную

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    try {
      await login(username, password);
      navigate(from, { replace: true }); // <-- Перенаправляем на 'from' или на главную
    } catch (err) {
      setError(err.message || 'Не удалось войти. Проверьте введенные данные.');
      console.error('Ошибка входа на LoginPage:', err);
    }
  };

  return (
    // JSX остается почти таким же, но теперь использует isLoading из контекста
    <> 
      <div className="sm:mx-auto sm:w-full sm:max-w-sm">
        <h2 className="mt-8 text-center text-2xl font-bold leading-9 tracking-tight text-gray-900">
          Вход в систему
        </h2>
      </div>

      <div className="mt-10 sm:mx-auto sm:w-full sm:max-w-sm">
        <form className="space-y-6" onSubmit={handleSubmit}>
          <div>
            <label htmlFor="username" className="block text-sm font-medium leading-6 text-gray-900">
              Имя пользователя
            </label>
            <div className="mt-2">
              <input
                id="username" name="username" type="text" autoComplete="username" required
                value={username} onChange={(e) => setUsername(e.target.value)}
                className="block w-full rounded-md border-0 py-1.5 px-2 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
              />
            </div>
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium leading-6 text-gray-900">
              Пароль
            </label>
            <div className="mt-2">
              <input
                id="password" name="password" type="password" autoComplete="current-password" required
                value={password} onChange={(e) => setPassword(e.target.value)}
                className="block w-full rounded-md border-0 py-1.5 px-2 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
              />
            </div>
          </div>

          {error && (
            <p className="text-sm text-red-600 bg-red-50 p-3 rounded-md">{error}</p>
          )}

          <div>
            <button
              type="submit" disabled={isLoading}
              className="flex w-full justify-center rounded-md bg-indigo-600 px-3 py-1.5 text-sm font-semibold leading-6 text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-offset-2 focus-visible:outline-indigo-600 disabled:bg-gray-400"
            >
              {isLoading ? 'Вход...' : 'Войти'}
            </button>
          </div>
        </form>
        {/* Пример ссылки на другую страницу, если нужно будет, например, регистрация */}
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