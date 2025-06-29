// frontend/src/services/apiService.js

// Класс для структурированных ошибок, экспортируем его
export class ApiError extends Error {
  constructor(statusCode, message) {
    super(message);
    this.name = 'ApiError';
    this.statusCode = statusCode;
  }
}

// Универсальная функция для всех запросов
const request = async (method, url, data = null, headers = {}) => {
    const defaultHeaders = {
        'Content-Type': 'application/json',
    };

    const token = localStorage.getItem('token');
    if (token) {
        defaultHeaders['Authorization'] = `Bearer ${token}`;
    }

    const config = {
        method: method,
        headers: { ...defaultHeaders, ...headers },
    };

    if (data && method !== 'GET') {
        if (data instanceof FormData || data instanceof URLSearchParams) {
            if (data instanceof FormData) {
                delete config.headers['Content-Type'];
            }
            config.body = data;
        } else {
            config.body = JSON.stringify(data);
        }
    }

    try {
        // ИСПОЛЬЗУЕМ ПЕРЕМЕННУЮ ОКРУЖЕНИЯ VITE
        // Она сама подставит префикс /api.
        // Запрос пойдет на тот же домен, с которого открыт сайт.
        const fullUrl = `${import.meta.env.VITE_API_BASE_URL}${url}`;
        const response = await fetch(fullUrl, config);

        if (!response.ok) {
            let errorData;
            try {
                errorData = await response.json();
            } catch (e) {
                errorData = { detail: response.statusText || 'Error' };
            }
            throw new ApiError(response.status, errorData.detail);
        }

        if (response.status === 204) return null;
        return await response.json();

    } catch (error) {
        console.error("API Service Error:", error);
        throw error;
    }
};

// Экспортируем объект с методами для использования в приложении
export const apiService = {
    get: (url, headers) => request('GET', url, null, headers),
    post: (url, data, headers) => request('POST', url, data, headers),
    put: (url, data, headers) => request('PUT', url, data, headers),
    delete: (url, headers) => request('DELETE', url, null, headers),
    patch: (url, data, headers) => request('PATCH', url, data, headers),
    setToken: (token) => localStorage.setItem('token', token),
    clearToken: () => localStorage.removeItem('token'),
};