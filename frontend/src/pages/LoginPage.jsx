// frontend/src/pages/LoginPage.jsx
import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext'; //
import { useNavigate, useLocation, Link } from 'react-router-dom'; //

// Наши новые компоненты и иконки
import Button from '../components/Button';
import Alert from '../components/Alert';
import { UserCircleIcon, LockClosedIcon } from '@heroicons/react/24/outline'; // Иконки как в RegisterPage

// API_BASE_URL здесь не нужен напрямую, так как login() из AuthContext его уже использует

function LoginPage() {
  const [username, setUsername] = useState(''); //
  const [password, setPassword] = useState(''); //
  const [error, setError] = useState(null); //

  const { login, isLoading } = useAuth(); //
  const navigate = useNavigate(); //
  const location = useLocation(); //

  const from = location.state?.from?.pathname || "/"; //

  const handleSubmit = async (e) => { //
    e.preventDefault(); //
    setError(null);
    try {
      await login(username, password); //
      navigate(from, { replace: true }); //
    } catch (err) { //
      setError(err.message || 'Не удалось войти. Проверьте введенные данные.'); //
      console.error('Ошибка входа на LoginPage:', err); //
    }
  };

  // Общие классы для полей ввода, как в RegisterPage
  const commonInputDivClasses = "relative";
  const commonInputClasses = "block w-full rounded-md border-0 py-2.5 pl-10 pr-3 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6";
  const commonIconClasses = "pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3";

  return (
    <>
      <div className="sm:mx-auto sm:w-full sm:max-w-sm"> {/* */}
        <h2 className="mt-8 text-center text-2xl font-bold leading-9 tracking-tight text-gray-900"> {/* */}
          Вход в систему
        </h2>
      </div>

      <div className="mt-10 sm:mx-auto sm:w-full sm:max-w-sm"> {/* */}
        <form className="space-y-6" onSubmit={handleSubmit}> {/* */}
          <div>
            <label htmlFor="username-login" className="block text-sm font-medium leading-6 text-gray-900"> {/* */}
              Имя пользователя
            </label>
            {/* ИЗМЕНЕННЫЙ INPUT USERNAME */}
            <div className={`mt-2 ${commonInputDivClasses}`}>
              <div className={commonIconClasses}>
                <UserCircleIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
              </div>
              <input
                id="username-login" // Изменил id для уникальности, если Register и Login на одной SPA-странице (маловероятно, но хорошая практика)
                name="username"
                type="text"
                autoComplete="username"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className={commonInputClasses} //
                placeholder="Ваш логин"
              />
            </div>
          </div>

          <div>
            <label htmlFor="password-login" className="block text-sm font-medium leading-6 text-gray-900"> {/* */}
              Пароль
            </label>
            {/* ИЗМЕНЕННЫЙ INPUT PASSWORD */}
            <div className={`mt-2 ${commonInputDivClasses}`}>
              <div className={commonIconClasses}>
                <LockClosedIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
              </div>
              <input
                id="password-login" // Изменил id
                name="password"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={commonInputClasses} //
                placeholder="••••••••"
              />
            </div>
          </div>

          {error && ( //
            <Alert type="error" message={error} />
          )}

          <div>
            <Button
              type="submit"
              variant="primary"
              size="md" // Оригинальный py-1.5, наш md py-2.
              disabled={isLoading} //
              fullWidth
            >
              {isLoading ? 'Вход...' : 'Войти'} {/* */}
            </Button>
          </div>
        </form>
        <p className="mt-10 text-center text-sm text-gray-500"> {/* */}
          Нет аккаунта?{' '} {/* */}
          <Link to="/register" className="font-semibold leading-6 text-indigo-600 hover:text-indigo-500"> {/* */}
            Зарегистрироваться
          </Link>
        </p>
      </div>
    </>
  );
}

export default LoginPage; //