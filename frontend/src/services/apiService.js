// frontend/src/services/apiService.js

import axios from 'axios';

const API_URL = 'http://localhost:8001/api/';

const api = axios.create({
    baseURL: API_URL,
});

api.interceptors.request.use(
    (config) => {
        // ИСПРАВЛЕНИЕ: Используем 'authToken' для получения токена из localStorage
        const token = localStorage.getItem('authToken'); 
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// export const setAuthToken = (token) => {
//     if (token) {
//         api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
//     } else {
//         delete api.defaults.headers.common['Authorization'];
//     }
// };

// api.interceptors.response.use(
//     (response) => response,
//     async (error) => {
//         const originalRequest = error.config;
//         if (error.response?.status === 401 && !originalRequest._retry) {
//             originalRequest._retry = true;
//             const refreshToken = localStorage.getItem('refresh_token');
//             if (!refreshToken) {
//                 window.dispatchEvent(new Event('logout'));
//                 return Promise.reject(error);
//             }
//             try {
//                 const { data } = await axios.post(`${API_URL}auth/refresh-token`, { refresh_token: refreshToken });
//                 localStorage.setItem('access_token', data.access_token);
//                 if (data.refresh_token) {
//                     localStorage.setItem('refresh_token', data.refresh_token);
//                 }
//                 setAuthToken(data.access_token);
//                 originalRequest.headers['Authorization'] = `Bearer ${data.access_token}`;
//                 return api(originalRequest);
//             } catch (refreshError) {
//                 window.dispatchEvent(new Event('logout'));
//                 return Promise.reject(refreshError);
//             }
//         }
//         return Promise.reject(error);
//     }
// );

export class ApiError extends Error {
    constructor(message, status, details = null) {
        super(message);
        this.name = 'ApiError';
        this.status = status;
        this.details = details;
    }
}

async function request(method, url, data = null, params = null) {
    try {
        const config = { method, url, data, params };
        const response = await api(config);
        return response.data;
    } catch (error) {
        const status = error.response ? error.response.status : 500;
        let message = 'Network Error';
        let details = null;

        if (error.response) {
            // ИСПРАВЛЕНИЕ: Проверяем, что error.response.data.detail существует перед доступом к нему
            if (status === 422 && error.response.data && Array.isArray(error.response.data.detail)) {
                // Преобразуем массив ошибок в читаемую строку
                message = "Ошибка валидации. Проверьте введенные данные.";
                details = error.response.data.detail.map(err => `${err.loc.join('.')} - ${err.msg}`).join('; ');
                console.error("Validation errors:", details);
            } else {
                message = error.response.data?.detail || 'API Error'; // Используем optional chaining
            }
        }
        
        console.error(`API Request Failed:`, new ApiError(message, status, details));
        throw new ApiError(message, status, details);
    }
}

// 5. Экспорт всех методов API
export const apiService = {
    // ИСПРАВЛЕНИЕ: Метод login теперь явно принимает username и password
    login: (username, password) => request('post', 'auth/token', new URLSearchParams({ username, password })),
    register: (userData) => request('post', 'users/', userData),
    getUserMe: () => request('get', 'users/me'),

    // Workspace
    getWorkspaces: () => request('get', 'workspaces/'),
    createWorkspace: (workspaceData) => request('post', 'workspaces/', workspaceData),
    setActiveWorkspace: (workspaceId) => request('post', `workspaces/${workspaceId}/set-active`),
    getActiveWorkspace: () => request('get', 'workspaces/active'),

    // Transactions
    getTransactions: (params) => request('get', 'transactions/', null, params),
    createTransaction: (transactionData) => request('post', 'transactions/', transactionData),
    updateTransaction: (id, transactionData) => request('put', `transactions/${id}`, transactionData),
    deleteTransaction: (id) => request('delete', `transactions/${id}`),

    // Accounts
    getAccounts: (workspaceId) => request('get', 'accounts/', null, { workspace_id: workspaceId }),
    createAccount: (accountData) => request('post', 'accounts/', accountData),

    // DDS Articles
    getDdsArticles: (workspaceId) => request('get', `dds-articles/?workspace_id=${workspaceId}`),
    createDdsArticle: (articleData) => request('post', 'dds-articles/', articleData),

    // Reports
    getDdsReport: (params) => request('get', 'reports/dds', null, params),

    // Statement
    uploadStatement: (formData) => request('post', 'statement/upload', formData, {
        headers: {
            'Content-Type': 'multipart/form-data',
        },
    }),
};