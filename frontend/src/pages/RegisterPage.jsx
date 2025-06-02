// frontend/src/pages/RegisterPage.jsx
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom'; //
import { LockClosedIcon, UserCircleIcon, EnvelopeIcon, IdentificationIcon } from '@heroicons/react/24/outline'; //

// Наши новые компоненты и конфигурация
import Button from '../components/Button';
import Alert from '../components/Alert';
import { API_BASE_URL } from '../apiConfig';

const RegisterPage = () => {
  const [username, setUsername] = useState(''); //
  const [email, setEmail] = useState(''); //
  const [fullName, setFullName] = useState(''); //
  const [password, setPassword] = useState(''); //
  const [confirmPassword, setConfirmPassword] = useState(''); //
  const [error, setError] = useState(null); //
  const [successMessage, setSuccessMessage] = useState(null); //
  const [isLoading, setIsLoading] = useState(false); //
  const navigate = useNavigate(); //

  const handleSubmit = async (e) => { //
    e.preventDefault(); //
    setError(null); //
    setSuccessMessage(null); //

    if (password !== confirmPassword) { //
      setError('Пароли не совпадают.'); //
      return;
    }
    if (password.length < 6) { //
        setError('Пароль должен содержать не менее 6 символов.'); //
        return;
    }

    setIsLoading(true); //

    try {
      const response = await fetch(`${API_BASE_URL}/users/`, { // Используем API_BASE_URL
        method: 'POST', //
        headers: { 'Content-Type': 'application/json' }, //
        body: JSON.stringify({ //
            username,
            email,
            password,
            full_name: fullName || null,
        }),
      });

      const data = await response.json(); //

      if (!response.ok) { //
        throw new Error(data.detail || `Ошибка регистрации: ${response.status}`); //
      }

      setSuccessMessage('Регистрация прошла успешно! Теперь вы можете войти.'); //
      setTimeout(() => { //
        navigate('/login'); //
      }, 3000);

    } catch (err) { //
      setError(err.message); //
      console.error("RegisterPage: Ошибка регистрации:", err); //
    } finally {
      setIsLoading(false); //
    }
  };

  const commonInputDivClasses = "relative"; //
  const commonInputClasses = "block w-full rounded-md border-0 py-2.5 pl-10 pr-3 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"; //
  const commonIconClasses = "pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3"; //


  return (
    <>
      <form onSubmit={handleSubmit} className="space-y-6"> {/* */}
        <div>
          <label htmlFor="username-reg" className="block text-sm font-medium leading-6 text-gray-900"> {/* */}
            Имя пользователя (логин)
          </label>
          <div className={commonInputDivClasses}> {/* */}
            <div className={commonIconClasses}><UserCircleIcon className="h-5 w-5 text-gray-400" /></div> {/* */}
            <input id="username-reg" name="username" type="text" autoComplete="username" required value={username} onChange={(e) => setUsername(e.target.value)} className={commonInputClasses} placeholder="my_username"/> {/* */}
          </div>
        </div>

        <div>
          <label htmlFor="email-reg" className="block text-sm font-medium leading-6 text-gray-900"> {/* */}
            Email адрес
          </label>
          <div className={commonInputDivClasses}> {/* */}
            <div className={commonIconClasses}><EnvelopeIcon className="h-5 w-5 text-gray-400" /></div> {/* */}
            <input id="email-reg" name="email" type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} className={commonInputClasses} placeholder="you@example.com"/> {/* */}
          </div>
        </div>

        <div>
          <label htmlFor="fullName-reg" className="block text-sm font-medium leading-6 text-gray-900"> {/* */}
            Полное имя <span className="text-xs text-gray-500">(необязательно)</span> {/* */}
          </label>
          <div className={commonInputDivClasses}> {/* */}
            <div className={commonIconClasses}><IdentificationIcon className="h-5 w-5 text-gray-400" /></div> {/* */}
            <input id="fullName-reg" name="fullName" type="text" value={fullName} onChange={(e) => setFullName(e.target.value)} className={commonInputClasses} placeholder="Иван Иванов"/> {/* */}
          </div>
        </div>

        <div>
          <label htmlFor="password-reg" className="block text-sm font-medium leading-6 text-gray-900"> {/* */}
            Пароль
          </label>
          <div className={commonInputDivClasses}> {/* */}
            <div className={commonIconClasses}><LockClosedIcon className="h-5 w-5 text-gray-400" /></div> {/* */}
            <input id="password-reg" name="password" type="password" required value={password} onChange={(e) => setPassword(e.target.value)} className={commonInputClasses} placeholder="••••••••"/> {/* */}
          </div>
        </div>

        <div>
          <label htmlFor="confirmPassword-reg" className="block text-sm font-medium leading-6 text-gray-900"> {/* */}
            Подтвердите пароль
          </label>
          <div className={commonInputDivClasses}> {/* */}
            <div className={commonIconClasses}><LockClosedIcon className="h-5 w-5 text-gray-400" /></div> {/* */}
            <input id="confirmPassword-reg" name="confirmPassword" type="password" required value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className={commonInputClasses} placeholder="••••••••"/> {/* */}
          </div>
        </div>

        {error && ( //
          <Alert type="error" message={error} />
        )}
        {successMessage && ( //
          <Alert type="success" message={successMessage} />
        )}

        <div>
          <Button
            type="submit"
            variant="primary"
            size="md" // Оригинальный py-2.5, наш md py-2. Достаточно близко.
            disabled={isLoading} //
            fullWidth
          >
            {isLoading ? 'Регистрация...' : 'Зарегистрироваться'} {/* */}
          </Button>
        </div>
      </form>

      <p className="mt-8 text-center text-sm text-gray-500"> {/* */}
        Уже есть аккаунт?{' '} {/* */}
        <Link to="/login" className="font-semibold leading-6 text-indigo-600 hover:text-indigo-500"> {/* */}
          Войти
        </Link>
      </p>
    </>
  );
};

export default RegisterPage; //