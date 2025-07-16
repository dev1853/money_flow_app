import axios from 'axios';

// 1. Создаем единый экземпляр axios
const apiClient = axios.create({
    baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api',
    headers: { 'Content-Type': 'application/json' },
});

// 2. Функции для управления токеном
export const setAuthHeader = (token) => {
    if (token) {
        apiClient.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    }
};

export const removeAuthHeader = () => {
    delete apiClient.defaults.headers.common['Authorization'];
};

// 3. Кастомный класс для ошибок API
export class ApiError extends Error {
    constructor(message, status, details = null) {
        super(message);
        this.name = 'ApiError';
        this.status = status;
        this.details = details;
    }
}

// 4. Централизованный обработчик ответов и ошибок (interceptor)
apiClient.interceptors.response.use(
    (response) => response,
    (error) => {
        const status = error.response?.status || 500;
        let message = 'Произошла непредвиденная ошибка';
        let details = null;
        if (error.response?.data?.detail) {
            if (status === 422 && Array.isArray(error.response.data.detail)) {
                message = "Ошибка валидации.";
                details = error.response.data.detail.map(err => `${err.loc.join('.')} - ${err.msg}`).join('; ');
            } else {
                message = error.response.data.detail;
            }
        } else if (error.message) {
            message = error.message;
        }
        console.error(`API Ошибка [${status}]:`, message, details || '');
        throw new ApiError(message, status, details);
    }
);

// 5. Универсальная функция для выполнения запросов
async function request(method, url, data = null, params = null) {
    try {
        const response = await apiClient({ method, url, data, params });
        return response.data;
    } catch (error) {
        // Interceptor уже обработал ошибку, просто пробрасываем ее дальше
        throw error;
    }
}

// 6. Экспорт всех методов API в едином стиле
export const apiService = {
    setAuthHeader,
    removeAuthHeader,

    // --- АУТЕНТИФИКАЦИЯ И РЕГИСТРАЦИЯ ---
    login: async (username, password) => {
        const params = new URLSearchParams();
        params.append('username', username);
        params.append('password', password);
        // Этот запрос специфичный, поэтому используем apiClient напрямую
        const response = await apiClient.post('auth/token', params, {
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        });
        return response.data;
    },
    register: (userData) => request('post', 'users/', userData),

    // --- ПОЛЬЗОВАТЕЛИ И ПРОСТРАНСТВА ---
    getUserMe: () => request('get', 'users/me'),
    getWorkspaces: () => request('get', 'workspaces/'),
    createWorkspace: (workspaceData) => request('post', 'workspaces/', workspaceData),
    setActiveWorkspace: (workspaceId) => request('post', `workspaces/${workspaceId}/set-active`),

    // --- ТРАНЗАКЦИИ ---
    getTransactions: (params) => request('get', 'transactions/', null, params),
    createTransaction: (data, params) => request('post', 'transactions/', data, params),
    updateTransaction: (id, data, params) => request('put', `transactions/${id}`, data, params),
    deleteTransaction: (id) => request('delete', `transactions/${id}`),
    // --- СЧЕТА ---
    getAccounts: (params) => request('get', 'accounts/', null, params),
    createAccount: (data) => request('post', 'accounts/', data),
    updateAccount: (id, data) => request('put', `accounts/${id}`, data),
    deleteAccount: (id) => request('delete', `accounts/${id}`),

    // --- СТАТЬИ ДДС ---
    getDdsArticles: (params) => request('get', 'dds-articles/', null, params),
    createDdsArticle: (data) => request('post', 'dds-articles/', data),
    updateDdsArticle: (id, data) => request('put', `dds-articles/${id}`, data),
    deleteDdsArticle: (id) => request('delete', `dds-articles/${id}`),

    // --- КОНТРАГЕНТЫ ---
    getCounterparties: (params) => request('get', 'counterparties/', null, params),
    createCounterparty: (data, params) => request('post', 'counterparties/', data, params),
    updateCounterparty: (id, data, params) => request('put', `counterparties/${id}`, data, params),
    deleteCounterparty: (id, params) => request('delete', `counterparties/${id}`, null, params),
    
    // --- БЮДЖЕТЫ (ИСПРАВЛЕНО) ---
    getBudgets: (params) => request('get', '/budgets/', null, params),
    createBudget: (budgetData) => request('post', '/budgets/', budgetData),
    updateBudget: (budgetId, budgetData) => request('put', `/budgets/${budgetId}`, budgetData),
    deleteBudget: (budgetId) => request('delete', `/budgets/${budgetId}`),
    getBudgetStatus: (budgetId) => request('get', `/budgets/${budgetId}/status`),
    getBudgetItems: (budgetId) => request('get', `/budgets/${budgetId}/items`),
    
    // --- ОТЧЕТЫ И ДАШБОРД ---
    getDdsReport: (params) => request('get', 'reports/dds', null, params),
    getProfitLossReport: (params) => request('get', 'reports/profit-loss', null, params),
    getDashboardSummary: (params) => request('get', 'dashboard/summary', null, params),
    getDashboardCashflowTrend: (params) => request('get', 'dashboard/cashflow-trend', null, params),
    getPaymentCalendar: (params) => request('get', '/payment-calendar/', null, params),

    // --- ВЫПИСКИ ---
    uploadStatement: (formData) => apiClient.post('statement/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
    }),
    // --- ОБЩИЕ ---
    getCategories: () => request('get', 'categories/'),
    getCurrencies: () => request('get', 'currencies/'),
    getTags: () => request('get', 'tags/'),
    // --- ДОГОВОРЫ ---
    getContracts: (params) => request('get', 'contracts/', null, params),
    createContract: (data, params) => request('post', 'contracts/', data, params),
    updateContract: (id, data, params) => request('put', `contracts/${id}`, data, params),
    deleteContract: (id, params) => request('delete', `contracts/${id}`, null, params),

    // --- ЗАПЛАНИРОВАННЫЕ ПЛАТЕЖИ ---
    getPlannedPayments: (params) => request('get', 'planned-payments/', null, params),
    createPlannedPayment: (data, params) => request('post', 'planned-payments/', data, params),
    updatePlannedPayment: (id, data, params) => request('put', `planned-payments/${id}`, data, params),
    deletePlannedPayment: (id, params) => request('delete', `planned-payments/${id}`, null, params),
};