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
      await apiService.post('/users/', {
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
    <div>
      <div className="w-full max-w-md space-y-8">
        <div>
          <h3 className="mt-6 text-center text-3xl font-bold tracking-tight text-gray-900">
            Регистрация
          </h3>
        </div>
        
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {error && <Alert type="error">{error}</Alert>}
          <div className="space-y-2">
            <div>
              <Label htmlFor="username">Имя пользователя</Label>
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
              <Label htmlFor="email">Email</Label>
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
              <Label htmlFor="password">Пароль</Label>
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
              <Label htmlFor="confirmPassword">Подтвердите пароль</Label>
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
          <p className="mt-10 text-center text-sm text-gray-500">
            Есть аккаунт?{' '}
            <Link to="/login" className="font-semibold leading-6 text-indigo-600 hover:text-indigo-500">
              Войти
            </Link>
          </p>

          <div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Создание аккаунта...' : 'Зарегистрироваться'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default RegisterPage;