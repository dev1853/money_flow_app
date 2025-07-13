// frontend/src/services/apiService.js

import axios from 'axios';

const API_URL = '/api/'; 

const api = axios.create({
    baseURL: API_URL,
});

api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('authToken'); 
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

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
        // --- ИСПРАВЛЕНО: Добавлены отладочные логи перед отправкой запроса ---
        console.log(`API Service: Sending ${config.method} request to ${config.url}`);
        if (config.params) {
            console.log("API Service: Request parameters:", config.params);
        }
        if (config.data) {
            console.log("API Service: Request data:", config.data);
        }
        // --- КОНЕЦ ОТЛАДОЧНЫХ ЛОГОВ ---
        const response = await api(config);
        return response.data;
    } catch (error) {
        const status = error.response ? error.response.status : 500;
        let message = 'Network Error';
        let details = null;

        if (error.response) {
            if (status === 422 && error.response.data && Array.isArray(error.response.data.detail)) {
                message = "Ошибка валидации. Проверьте введенные данные.";
                details = error.response.data.detail.map(err => `${err.loc.join('.')} - ${err.msg}`).join('; ');
                console.error("Validation errors:", details);
            } else {
                message = error.response.data?.detail || 'API Error'; 
            }
        }
        
        console.error(`API Request Failed:`, new ApiError(message, status, details));
        throw new ApiError(message, status, details);
    }
}

// 5. Экспорт всех методов API
export const apiService = {
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
    updateAccount: (id, accountData) => request('put', `accounts/${id}`, accountData),
    deleteAccount: (id) => request('delete', `accounts/${id}`), 

    // DDS Articles
    getDdsArticleById: (articleId) => request('get', `dds-articles/${articleId}`),
    getDdsArticles: (workspaceId) => request('get', `dds-articles/?workspace_id=${workspaceId}`),
    createDdsArticle: (articleData) => request('post', 'dds-articles/', articleData),
    updateDdsArticle: (articleId, articleData) => request('put', `dds-articles/${articleId}`, articleData),
    deleteDdsArticle: (articleId) => request('delete', `dds-articles/${articleId}`),

    // Reports
    getDdsReport: (params) => request('get', 'reports/dds', null, params), // Этот вызов был проблемным

    // Dashboard
    getProfitLossReport: (params) => request('get', 'reports/profit-loss', null, params),
    getDashboardSummary: (workspaceId, startDate, endDate) =>
        request('get', 'dashboard/summary', null, { workspace_id: workspaceId, start_date: startDate, end_date: endDate }),
    getDashboardCashflowTrend: (workspaceId, startDate, endDate, periodType) =>
        request('get', 'dashboard/cashflow-trend', null, { workspace_id: workspaceId, start_date: startDate, end_date: endDate, period_type: periodType }),

    // Budgets 
    getBudgets: (params) => request('get', 'budgets/', null, params), 
    createBudget: (budgetData) => request('post', 'budgets/', budgetData), 
    getBudgetStatus: (budgetId) => request('get', `budgets/${budgetId}/status`), 
    updateBudget: (budgetId, budgetData) => request('put', `budgets/${budgetId}`, budgetData), 
    deleteBudget: (budgetId) => request('delete', `budgets/${budgetId}`), 


    // Методы для запланированных платежей
    getPlannedPayments: (params) => request('get', 'planned-payments/', null, params),
    createPlannedPayment: (paymentData) => request('post', 'planned-payments/', paymentData),
    updatePlannedPayment: (paymentId, paymentData) => request('put', `planned-payments/${paymentId}`, paymentData),
    deletePlannedPayment: (paymentId) => request('delete', `planned-payments/${paymentId}`),

    // Методы для платежного календаря
    getPaymentCalendar: (params) => request('get', 'payment-calendar/', null, params),


    // Statement
    uploadStatement: (formData) => request('post', 'statement/upload', formData, {
        headers: {
            'Content-Type': 'multipart/form-data',
        },
    }),

    // Методы для Контрагентов (Counterparties)
    getCounterparties: (params) => request('get', 'counterparties/', null, params),
    createCounterparty: (counterpartyData) => request('post', 'counterparties/', counterpartyData),
    getCounterpartyById: (id) => request('get', `counterparties/${id}`),
    updateCounterparty: (id, counterpartyData) => request('put', `counterparties/${id}`, counterpartyData),
    deleteCounterparty: (id) => request('delete', `counterparties/${id}`),

    // Методы для Договоров (Contracts)
    getContracts: (params) => request('get', 'contracts/', null, params), 
    createContract: (contractData) => request('post', 'contracts/', contractData),
    getContractById: (id) => request('get', `contracts/${id}`),
    updateContract: (id, contractData) => request('put', `contracts/${id}`, contractData),
    deleteContract: (id) => request('delete', `contracts/${id}`),
};