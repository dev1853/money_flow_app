// /frontend/src/contexts/AuthContext.jsx

import React, { createContext, useState, useContext, useEffect, useCallback, useMemo } from 'react';
import { apiService, setAuthHeader, removeAuthHeader } from '../services/apiService';
import { useLocalStorage } from '../hooks/useLocalStorage';

const AuthContext = createContext(null);

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth должен использоваться внутри AuthProvider');
    }
    return context;
};

export const AuthProvider = ({ children }) => {
    const [token, setToken] = useLocalStorage('authToken', null);
    const [currentUser, setCurrentUser] = useState(null);
    const [workspaces, setWorkspaces] = useState([]);
    const [activeWorkspace, setActiveWorkspace] = useState(null);
    const [accounts, setAccounts] = useState([]);
    const [ddsArticles, setDdsArticles] = useState([]);
    const [loading, setLoading] = useState(true);

    // --- ИЗМЕНЕНИЕ 1: Функция переименована для единообразия ---
    const fetchDataForWorkspace = useCallback(async (workspaceId) => {
        if (!workspaceId) {
            setAccounts([]);
            setDdsArticles([]);
            return;
        }
        try {
            // Загружаем параллельно для скорости
            const [fetchedAccounts, fetchedArticles] = await Promise.all([
                apiService.getAccounts({ workspace_id: workspaceId }),
                apiService.getDdsArticles({ workspace_id: workspaceId })
            ]);
            setAccounts(Array.isArray(fetchedAccounts) ? fetchedAccounts : (fetchedAccounts?.items || []));
            setDdsArticles(fetchedArticles || []); // getDdsArticles возвращает массив напрямую
        } catch (error) {
            console.error("Ошибка загрузки данных рабочего пространства:", error);
            setAccounts([]);
            setDdsArticles([]);
        }
    }, []);

    useEffect(() => {
        const initializeApp = async () => {
            if (!token) {
                setLoading(false);
                return;
            }
            
            setLoading(true);
            setAuthHeader(token);

            try {
                const [user, userWorkspaces] = await Promise.all([
                    apiService.getUserMe(),
                    apiService.getWorkspaces()
                ]);

                setCurrentUser(user);
                setWorkspaces(userWorkspaces || []);
                
                let workspaceToActivate = null;
                if (userWorkspaces && userWorkspaces.length > 0) {
                    const savedId = localStorage.getItem('active_workspace_id');
                    workspaceToActivate = 
                        userWorkspaces.find(ws => String(ws.id) === savedId) || 
                        userWorkspaces.find(ws => ws.id === user.active_workspace_id) ||
                        userWorkspaces[0];
                }
                
                setActiveWorkspace(workspaceToActivate);

                if (workspaceToActivate) {
                    localStorage.setItem('active_workspace_id', workspaceToActivate.id);
                    await fetchDataForWorkspace(workspaceToActivate.id);
                } else {
                    localStorage.removeItem('active_workspace_id');
                }
            } catch (err) {
                console.error("Ошибка сессии, выход из системы:", err);
                logout(); 
            } finally {
                setLoading(false);
            }
        };

        initializeApp();
    }, [token, fetchDataForWorkspace]);


    const login = async (email, password) => {
        const data = await apiService.login(email, password);
        setToken(data.access_token);
    };

    const logout = () => {
        setToken(null);
        setCurrentUser(null);
        setWorkspaces([]);
        setActiveWorkspace(null);
        setAccounts([]);
        setDdsArticles([]);
        localStorage.removeItem('active_workspace_id');
        removeAuthHeader();
    };

    const changeActiveWorkspace = useCallback(async (workspaceId) => {
        const selected = workspaces.find(ws => ws.id === workspaceId);
        if (selected && selected.id !== activeWorkspace?.id) {
            setLoading(true);
            setActiveWorkspace(selected);
            localStorage.setItem('active_workspace_id', workspaceId);
            await fetchDataForWorkspace(workspaceId);
            setLoading(false);
        }
    }, [workspaces, activeWorkspace, fetchDataForWorkspace]);

    // --- ИЗМЕНЕНИЕ 2: Добавляем fetchDataForWorkspace в контекст ---
    const value = useMemo(() => ({
        currentUser,
        isAuthenticated: !!token,
        loading,
        workspaces,
        activeWorkspace,
        accounts,
        ddsArticles,
        login,
        logout,
        setActiveWorkspace: changeActiveWorkspace,
        fetchDataForWorkspace,
    }), [
        currentUser, 
        token, 
        loading, 
        workspaces, 
        activeWorkspace, 
        accounts, 
        ddsArticles, 
        changeActiveWorkspace, 
        fetchDataForWorkspace
    ]);

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};