import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { apiService } from '../services/apiService';
import Alert from '../components/Alert';
import Button from '../components/Button';
import Input from '../components/forms/Input';
import Label from '../components/forms/Label';

function RegisterPage() {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (formData.password !== formData.confirmPassword) {
      setError('Пароли не совпадают.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      await apiService.post('/api/users/', {
        username: formData.username,
        email: formData.email,
        password: formData.password,
      });
      await login(formData.email, formData.password);
    } catch (err) {
      setError(err.message || 'Не удалось зарегистрироваться.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-full items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-gray-50">
      <div className="w-full max-w-md space-y-8">
        <div>
          {/* Здесь вы можете разместить свой логотип */}
          {/* <img className="mx-auto h-12 w-auto" src="path/to/your/logo.svg" alt="Your Company" /> */}
          <h2 className="mt-6 text-center text-3xl font-bold tracking-tight text-gray-900">
            Создайте свой аккаунт
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Или{' '}
            <Link to="/login" className="font-medium text-indigo-600 hover:text-indigo-500">
              войдите в существующий
            </Link>
          </p>
        </div>
        
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {error && <Alert type="error">{error}</Alert>}
          <div className="space-y-4 rounded-md shadow-sm">
            <div>
              <Label htmlFor="username" className="sr-only">Имя пользователя</Label>
              <Input
                id="username"
                name="username"
                type="text"
                autoComplete="username"
                required
                className="rounded-t-md"
                placeholder="Имя пользователя"
                value={formData.username}
                onChange={handleChange}
              />
            </div>
            <div>
              <Label htmlFor="email" className="sr-only">Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                className="rounded-none"
                placeholder="Email"
                value={formData.email}
                onChange={handleChange}
              />
            </div>
            <div>
              <Label htmlFor="password" className="sr-only">Пароль</Label>
              <Input
                id="password"
                name="password"
                type="password"
                autoComplete="new-password"
                required
                className="rounded-none"
                placeholder="Пароль"
                value={formData.password}
                onChange={handleChange}
              />
            </div>
            <div>
              <Label htmlFor="confirmPassword" className="sr-only">Подтвердите пароль</Label>
              <Input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                autoComplete="new-password"
                required
                className="rounded-b-md"
                placeholder="Подтвердите пароль"
                value={formData.confirmPassword}
                onChange={handleChange}
              />
            </div>
          </div>

          <div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Создание аккаунта...' : 'Создать аккаунт'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default RegisterPage;