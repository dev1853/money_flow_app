// frontend/src/pages/RegisterPage.jsx
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { apiService } from '../services/apiService';
import { useApiMutation } from '../hooks/useApiMutation';

// Ваши кастомные компоненты
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
    const { login } = useAuth();
    const navigate = useNavigate();
    
    // --- ИСПРАВЛЕНИЕ 1: Один источник ошибок ---
    // Объединяем локальные ошибки и ошибки от API в одно состояние
    const [error, setError] = useState('');

    // --- ИСПРАВЛЕНИЕ 2: Упрощаем вызов useApiMutation ---
    // Передаем функцию `apiService.register` напрямую
    const [handleRegister, isLoading] = useApiMutation(apiService.register, {
        onSuccess: async () => {
            // После успешной регистрации пытаемся войти
            try {
                await login(formData.email, formData.password);
                navigate('/dashboard', { replace: true });
            } catch (loginError) {
                // Если логин не удался, сообщаем пользователю
                setError('Регистрация прошла успешно, но не удалось войти. Пожалуйста, попробуйте войти вручную.');
                // И перенаправляем на страницу логина
                setTimeout(() => navigate('/login'), 3000);
            }
        },
        onError: (err) => {
            // При ошибке регистрации от API, устанавливаем ее в наше состояние
            setError(err.message || 'Произошла ошибка при регистрации.');
        }
    });

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        // Сбрасываем ошибку при любом изменении в форме
        if (error) setError('');
    };

    const handleSubmit = (e) => {
        e.preventDefault();

        // Простая локальная валидация
        if (formData.password !== formData.confirmPassword) {
            setError('Пароли не совпадают.');
            return;
        }
        if (formData.password.length < 8) {
            setError('Пароль должен содержать не менее 8 символов.');
            return;
        }

        // Если все хорошо, сбрасываем ошибку и отправляем данные
        setError('');
        handleRegister({
            username: formData.username,
            email: formData.email,
            password: formData.password,
        });
    };

    return (
        <div className="flex min-h-full flex-1 flex-col justify-center px-6 py-12 lg:px-8">
            <div className="sm:mx-auto sm:w-full sm:max-w-sm">
                <h2 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-gray-100">
                    Создание аккаунта
                </h2>
            </div>

            <div className="mt-10 sm:mx-auto sm:w-full sm:max-w-sm">
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <Label htmlFor="username">Имя пользователя</Label>
                        <div className="mt-2">
                            <Input id="username" name="username" type="text" required value={formData.username} onChange={handleChange} placeholder="Ваше имя пользователя" />
                        </div>
                    </div>

                    <div>
                        <Label htmlFor="email">Email адрес</Label>
                        <div className="mt-2">
                            <Input id="email" name="email" type="email" required autoComplete="email" value={formData.email} onChange={handleChange} placeholder="you@example.com" />
                        </div>
                    </div>

                    <div>
                        <Label htmlFor="password">Пароль</Label>
                        <div className="mt-2">
                            <Input id="password" name="password" type="password" required autoComplete="new-password" value={formData.password} onChange={handleChange} placeholder="••••••••" />
                        </div>
                    </div>

                    <div>
                        <Label htmlFor="confirmPassword">Подтвердите пароль</Label>
                        <div className="mt-2">
                            <Input id="confirmPassword" name="confirmPassword" type="password" required autoComplete="new-password" value={formData.confirmPassword} onChange={handleChange} placeholder="••••••••" />
                        </div>
                    </div>

                    {/* --- ИСПРАВЛЕНИЕ 3: Передаем ошибку как children --- */}
                    {error && <Alert type="error">{error}</Alert>}

                    <div>
                        <Button type="submit" className="w-full" disabled={isLoading} fullWidth>
                            {isLoading ? 'Создание аккаунта...' : 'Зарегистрироваться'}
                        </Button>
                    </div>
                </form>

                <p className="mt-10 text-center text-sm text-gray-500 dark:text-gray-400">
                    Уже есть аккаунт?{' '}
                    <Link to="/login" className="font-semibold leading-6 text-indigo-600 hover:text-indigo-500 dark:text-indigo-400 dark:hover:text-indigo-300">
                        Войти
                    </Link>
                </p>
            </div>
        </div>
    );
}

export default RegisterPage;