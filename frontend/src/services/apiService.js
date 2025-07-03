import axios from 'axios';

// 1. Убеждаемся, что базовый URL заканчивается на слэш
const API_URL = 'http://localhost:8001/api/';

const api = axios.create({
    baseURL: API_URL,
});

// 2. Перехватчик запросов для добавления JWT токена
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('access_token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// 3. Перехватчик ответов для "бесшовного" обновления токена
let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
    failedQueue.forEach(prom => {
        if (error) {
            prom.reject(error);
        } else {
            prom.resolve(token);
        }
    });
    failedQueue = [];
};

api.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;
        // Перехватываем ошибку 401 и убеждаемся, что это не повторный запрос
        if (error.response?.status === 401 && !originalRequest._retry) {
            if (isRefreshing) {
                // Если токен уже обновляется, ставим запрос в очередь
                return new Promise(function(resolve, reject) {
                    failedQueue.push({ resolve, reject });
                })
                .then(token => {
                    originalRequest.headers['Authorization'] = 'Bearer ' + token;
                    return api(originalRequest);
                });
            }

            originalRequest._retry = true;
            isRefreshing = true;

            const refreshToken = localStorage.getItem('refresh_token');
            if (!refreshToken) {
                // Если нет refresh токена, ничего сделать не можем, отправляем на логин
                // Здесь можно вызывать logout из AuthContext
                return Promise.reject(error);
            }

            try {
                // Запрашиваем новую пару токенов
                // ПРИМЕЧАНИЕ: эндпоинт и структура запроса должны соответствовать вашему бэкенду
                const { data } = await axios.post(`${API_URL}auth/refresh-token`, {
                    refresh_token: refreshToken
                });
                
                // Сохраняем новые токены
                localStorage.setItem('access_token', data.access_token);
                localStorage.setItem('refresh_token', data.refresh_token);
                
                // Обновляем заголовок для будущих запросов
                api.defaults.headers.common['Authorization'] = 'Bearer ' + data.access_token;
                originalRequest.headers['Authorization'] = 'Bearer ' + data.access_token;
                
                // Выполняем запросы из очереди с новым токеном
                processQueue(null, data.access_token);
                // Повторяем изначальный запрос
                return api(originalRequest);

            } catch (refreshError) {
                processQueue(refreshError, null);
                // Если даже обновление не сработало, разлогиниваем пользователя
                localStorage.removeItem('access_token');
                localStorage.removeItem('refresh_token');
                // Редирект на страницу логина
                if (window.location.pathname !== '/login') {
                    window.location = '/login';
                }
                return Promise.reject(refreshError);
            } finally {
                isRefreshing = false;
            }
        }
        return Promise.reject(error);
    }
);

// 4. Универсальная обертка для запросов и ошибок (без изменений)
export class ApiError extends Error {
    constructor(message, status, details = null) {
        super(message);
        this.name = 'ApiError';
        this.status = status;
        this.details = details; // Поле для хранения деталей валидации
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
            // --- КЛЮЧЕВОЕ ИСПРАВЛЕНИЕ ЗДЕСЬ ---
            // FastAPI при ошибке 422 возвращает массив в поле `detail`
            if (status === 422 && Array.isArray(error.response.data.detail)) {
                // Преобразуем массив ошибок в читаемую строку
                message = "Ошибка валидации. Проверьте введенные данные.";
                details = error.response.data.detail.map(err => `${err.loc.join('.')} - ${err.msg}`).join('; ');
                console.error("Validation errors:", details);
            } else {
                message = error.response.data.detail || 'API Error';
            }
        }
        
        console.error(`API Request Failed:`, new ApiError(message, status, details));
        throw new ApiError(message, status, details);
    }
}

// 5. Экспорт всех методов API
export const apiService = {
    // ВАЖНО: ваш метод login в AuthContext должен теперь сохранять и access_token, и refresh_token
    login: (credentials) => request('post', 'auth/token', new URLSearchParams(credentials)),
    register: (userData) => request('post', 'users/', userData),

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
    getAccounts: (workspaceId) => request('get', `accounts/?workspace_id=${workspaceId}`),
    createAccount: (accountData) => request('post', 'accounts/', accountData),

    // DDS Articles
    getDdsArticles: (workspaceId) => request('get', `dds-articles/?workspace_id=${workspace_id}`),
    createDdsArticle: (articleData) => request('post', 'dds-articles/', articleData),

    // Reports
    getDdsReport: (params) => request('get', 'reports/dds', null, params),

    // Statement
    uploadStatement: (formData) => request('post', 'statement/upload', formData, {
        headers: {
            'Content-Type': 'multipart/form-data',
        },
    }),
    
    // ... и остальные ваши методы API
};