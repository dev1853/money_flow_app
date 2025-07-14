import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useApiMutation } from '../hooks/useApiMutation';

import Button from '../components/Button';
import Alert from '../components/Alert';
import Input from '../components/forms/Input';
import Label from '../components/forms/Label';

function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname || "/dashboard";

  const [handleLogin, isLoading, error] = useApiMutation(login, {
    onSuccess: () => {
      navigate(from, { replace: true });
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!email || !password) return;
    handleLogin(email, password);
  };

  return (
    <div className="flex min-h-full flex-1 flex-col justify-center px-6 py-12 lg:px-8">
        <div className="sm:mx-auto sm:w-full sm:max-w-sm">
        <h2 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-gray-100">
                Вход в ваш аккаунт
            </h2>
        </div>
        <div className="mt-10 sm:mx-auto sm:w-full sm:max-w-sm">
            <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                    <Label htmlFor="email">Email</Label>
                    <div className="mt-2">
                        <Input id="email" name="email" type="email" required autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" />
                    </div>
                </div>
                <div>
                    <Label htmlFor="password">Пароль</Label>
                    <div className="mt-2">
                        <Input id="password" name="password" type="password" required autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••"/>
                    </div>
                </div>
                {error && <Alert type="error">{error}</Alert>}
                <div>
                    <Button type="submit" className="w-full" variant="primary" disabled={isLoading} fullWidth>
                        {isLoading ? 'Вход...' : 'Войти'}
                    </Button>
                </div>
            </form>
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                Нет аккаунта?{' '}
                <Link to="/register" className="font-medium text-indigo-600 hover:text-indigo-500 dark:text-indigo-400 dark:hover:text-indigo-300">
                    Зарегистрироваться
                </Link>
            </p>
        </div>
    </div>
  );
}

export default LoginPage;