// frontend/src/contexts/AuthContext.jsx

import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiService } from '../services/apiService';

// 1. Создание контекста
const AuthContext = createContext(null);

// 2. Хук для удобного доступа к контексту
export const useAuth = () => useContext(AuthContext);

// 3. Основной компонент-провайдер
export const AuthProvider = ({ children }) => {
    const [currentUser, setCurrentUser] = useState(null);
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [loading, setLoading] = useState(true);
    const [activeWorkspace, setActiveWorkspaceState] = useState(null);
    const [workspaces, setWorkspaces] = useState([]);
    const [accounts, setAccounts] = useState([]);
    const [ddsArticles, setDdsArticles] = useState([]);

    const fetchDataForWorkspace = useCallback(async (workspaceId) => {
        if (!workspaceId) {
            setAccounts([]);
            setDdsArticles([]);
            return;
        }
        try {
            const [fetchedAccounts, fetchedArticles] = await Promise.all([
                apiService.getAccounts(workspaceId),
                apiService.getDdsArticles(workspaceId)
            ]);
            setAccounts(fetchedAccounts || []);
            setDdsArticles(fetchedArticles || []);
        } catch (error) {
            console.error("Ошибка загрузки данных рабочего пространства:", error);
            setAccounts([]);
            setDdsArticles([]);
        }
    }, []);
    
    // Функция для получения данных пользователя и связанных сущностей
    const fetchUserAndInitialData = useCallback(async () => {
        setLoading(true);
        // ИСПРАВЛЕНИЕ: Теперь используем 'authToken' для чтения токена
        const token = localStorage.getItem('authToken'); 
        if (token) {
            try {
                const user = await apiService.getUserMe();
                const fetchedWorkspaces = await apiService.getWorkspaces();
                setCurrentUser(user);
                setIsAuthenticated(true);
                setWorkspaces(fetchedWorkspaces);

                const activeWsId = localStorage.getItem('active_workspace_id') || user.active_workspace_id;
                const activeWs = fetchedWorkspaces.find(ws => String(ws.id) === String(activeWsId)) || fetchedWorkspaces[0];
                
                if (activeWs) {
                    setActiveWorkspaceState(activeWs);
                    localStorage.setItem('active_workspace_id', activeWs.id);
                    await fetchDataForWorkspace(activeWs.id);
                } else if (fetchedWorkspaces.length > 0) {
                    // Если у пользователя нет активного воркспейса, но есть другие, выбираем первый
                    const firstWorkspace = fetchedWorkspaces[0];
                    setActiveWorkspaceState(firstWorkspace);
                    localStorage.setItem('active_workspace_id', firstWorkspace.id);
                    await fetchDataForWorkspace(firstWorkspace.id);
                } else {
                    // Если воркспейсов нет вообще, очищаем данные
                    setActiveWorkspaceState(null);
                    localStorage.removeItem('active_workspace_id');
                    setAccounts([]);
                    setDdsArticles([]);
                }
            } catch (err) {
                console.error("Ошибка сессии, выход из системы:", err);
                localStorage.removeItem('authToken');
                localStorage.removeItem('active_workspace_id'); // Добавлено для полной очистки
                setIsAuthenticated(false);
                setCurrentUser(null);
                setActiveWorkspaceState(null); // Очищаем активный воркспейс при ошибке
                setWorkspaces([]); // Очищаем воркспейсы
                setAccounts([]); // Очищаем счета
                setDdsArticles([]); // Очищаем статьи ДДС
            }
        } else {
            // Если токена нет, убеждаемся, что все состояния очищены
            setIsAuthenticated(false);
            setCurrentUser(null);
            setActiveWorkspaceState(null);
            setWorkspaces([]);
            setAccounts([]);
            setDdsArticles([]);
            localStorage.removeItem('active_workspace_id');
        }
        setLoading(false);
    }, [fetchDataForWorkspace]);

    useEffect(() => {
        fetchUserAndInitialData();
    }, [fetchUserAndInitialData]);

    useEffect(() => {
        if (workspaces.length > 0 && !activeWorkspace) {
            const lastWorkspaceId = localStorage.getItem('active_workspace_id'); // <-- Правильный ключ
            const lastWorkspace = workspaces.find(ws => String(ws.id) === lastWorkspaceId);
            setActiveWorkspaceState(lastWorkspace || workspaces[0]); // <-- Прямая установка состояния
        }
    }, [workspaces]); 

    // Функция входа в систему
    const login = async (email, password) => {
        // ИСПРАВЛЕНИЕ: Передаем username и password явно в apiService.login
        const data = await apiService.login(email, password); 
        // ИСПРАВЛЕНИЕ: Сохраняем токен с ключом 'authToken'
        localStorage.setItem('authToken', data.access_token);
        await fetchUserAndInitialData();
    };

    const logout = () => {
        localStorage.removeItem('authToken');
        localStorage.removeItem('active_workspace_id');
        setIsAuthenticated(false);
        setCurrentUser(null);
        setActiveWorkspaceState(null); // Убедимся, что активный воркспейс очищен
        setWorkspaces([]); // Очищаем список воркспейсов
        setAccounts([]); // Очищаем счета
        setDdsArticles([]); // Очищаем статьи ДДС
    };

    // Функция смены активного рабочего пространства
    const changeActiveWorkspace = useCallback(async (workspaceId) => { 
        const selectedWorkspace = workspaces.find(ws => String(ws.id) === String(workspaceId));
        if (selectedWorkspace) {
            setActiveWorkspaceState(selectedWorkspace);
            // Сохраняем выбор пользователя
            localStorage.setItem('active_workspace_id', workspaceId); 
            await fetchDataForWorkspace(workspaceId);
        }  else {
             // Если выбранный воркспейс не найден, очищаем активный
            setActiveWorkspaceState(null);
            localStorage.removeItem('active_workspace_id');
            setAccounts([]);
            setDdsArticles([]);
        }
    }, [workspaces, fetchDataForWorkspace]); 

     const contextValue = {
        currentUser, isAuthenticated, loading, login, logout,
        activeWorkspace, workspaces, setActiveWorkspace: changeActiveWorkspace,
        accounts, ddsArticles, 
        fetchDataForWorkspace,
    };

    return (
        <AuthContext.Provider value={contextValue}>
            {!loading && children}
        </AuthContext.Provider>
    );
};