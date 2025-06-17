// frontend/src/pages/LoginPage.jsx
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import AuthLayout from '../layouts/AuthLayout';
import InputField from '../components/forms/InputField';
import Button from '../components/Button';
import Alert from '../components/Alert';

const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);
    try {
      await login(email, password);
      navigate('/dashboard');
    } catch (err) {
      setError(err.message || 'Не удалось войти. Проверьте почту и пароль.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthLayout title="Войдите в свой аккаунт">
      <form className="space-y-6" onSubmit={handleSubmit}>
        <InputField
          id="email"
          label="Email"
          name="email"
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        
        <InputField
          id="password"
          label="Пароль"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        <div className="flex items-center justify-between">
          <div className="text-sm">
            <a href="#" className="font-semibold text-indigo-600 hover:text-indigo-500">
              Забыли пароль?
            </a>
          </div>
        </div>

        {error && <Alert type="error" message={error} />}

        <div>
          <Button type="submit" disabled={isLoading} fullWidth>
            {isLoading ? 'Вход...' : 'Войти'}
          </Button>
        </div>
      </form>

      <p className="mt-10 text-center text-sm text-gray-500">
        Еще не зарегистрированы?{' '}
        <Link to="/register" className="font-semibold leading-6 text-indigo-600 hover:text-indigo-500">
          Создайте аккаунт
        </Link>
      </p>
    </AuthLayout>
  );
};

export default LoginPage;