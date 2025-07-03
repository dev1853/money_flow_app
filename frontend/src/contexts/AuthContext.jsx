import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { apiService } from '../services/apiService';

const AuthContext = createContext(null);

export const useAuth = () => useContext(AuthContext);

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

    const fetchUserAndInitialData = useCallback(async () => {
        setLoading(true);
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
                }
            } catch (err) {
                console.error("Ошибка сессии, выход из системы:", err);
                localStorage.removeItem('authToken');
                setIsAuthenticated(false);
                setCurrentUser(null);
            }
        }
        setLoading(false);
    }, [fetchDataForWorkspace]);

    useEffect(() => {
        fetchUserAndInitialData();
    }, [fetchUserAndInitialData]);

    const login = async (email, password) => {
        const data = await apiService.login(email, password); 
        localStorage.setItem('authToken', data.access_token);
        await fetchUserAndInitialData();
    };

    const logout = () => {
        localStorage.removeItem('authToken');
        localStorage.removeItem('active_workspace_id');
        setIsAuthenticated(false);
        setCurrentUser(null);
    };
    
    const changeActiveWorkspace = useCallback(async (workspaceId) => { 
        const selectedWorkspace = workspaces.find(ws => String(ws.id) === String(workspaceId));
        if (selectedWorkspace) {
            setActiveWorkspaceState(selectedWorkspace);
            localStorage.setItem('active_workspace_id', workspaceId);
            await fetchDataForWorkspace(workspaceId);
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