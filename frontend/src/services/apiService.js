// frontend/src/services/apiService.js

import API_BASE_URL from '../apiConfig';

class ApiError extends Error {
  constructor(statusCode, message) {
    super(message);
    this.name = 'ApiError';
    this.statusCode = statusCode;
  }
}

const request = async (method, url, data = null, headers = {}) => {
    const defaultHeaders = {
        'Content-Type': 'application/json',
    };

    const token = localStorage.getItem('accessToken');
    if (token) {
        defaultHeaders['Authorization'] = `Bearer ${token}`;
    }

    const config = {
        method: method,
        headers: { ...defaultHeaders, ...headers },
    };

    if (data && method !== 'GET') {
        // НОВОЕ: Проверяем, является ли тело запроса FormData
        if (data instanceof FormData) { // <--- ИСПРАВЛЕНО ЗДЕСЬ!
            // Для FormData браузер сам установит Content-Type, включая boundary.
            // Нам нужно убедиться, что Content-Type не установлен вручную, чтобы он не конфликтовал.
            delete config.headers['Content-Type']; // Удаляем заголовок Content-Type, если отправляем FormData
            config.body = data; // Тело запроса - сам объект FormData
        } else {
            // Для обычных JSON-запросов
            config.body = JSON.stringify(data);
        }
    }

    try {
        const response = await fetch(`${API_BASE_URL}${url}`, config);
        
        if (!response.ok) {
            let errorData = null;
            const contentType = response.headers.get("content-type");
            if (contentType && contentType.indexOf("application/json") !== -1) {
                errorData = await response.json();
            } else {
                errorData = await response.text();
            }
            
            let errorMessage = "Неизвестная ошибка API.";
            if (errorData && typeof errorData === 'object' && errorData.detail) {
                // ИСПРАВЛЕНО: Форматируем массив ошибок в читаемую строку
                if (Array.isArray(errorData.detail)) {
                    errorMessage = errorData.detail.map(err => {
                        // Ошибки Pydantic имеют loc, msg, type
                        if (err.loc && err.msg) {
                            return `${err.loc.join(' -> ')}: ${err.msg}`;
                        }
                        return err.msg || JSON.stringify(err);
                    }).join('; ');
                } else if (typeof errorData.detail === 'string') {
                    errorMessage = errorData.detail;
                }
            } else if (typeof errorData === 'string') {
                errorMessage = errorData;
            } else {
                errorMessage = response.statusText;
            }
            
            throw new ApiError(response.status, errorMessage); 
        }

        if (response.status === 204) {
            return null;
        }

        return await response.json();
    } catch (error) {
        if (error instanceof ApiError) {
            throw error;
        } else if (error.message === 'Failed to fetch') {
            throw new Error('Сетевая ошибка или сервер недоступен.');
        } else {
            throw new Error(error.message || 'Произошла неизвестная ошибка.');
        }
    }
};

const apiService = {
    // Вспомогательные методы для HTTP-запросов
    get: (url, headers) => request('GET', url, null, headers),
    post: (url, data, headers) => request('POST', url, data, headers),
    put: (url, data, headers) => request('PUT', url, data, headers),
    delete: (url, headers) => request('DELETE', url, null, headers),
    patch: (url, data, headers) => request('PATCH', url, data, headers),

    // --- Изменение здесь ---
    login: async ({ username, password }) => {
        // ИСПРАВЛЕНО: URL для логина изменен с '/auth/token' на '/token'
        const formData = new URLSearchParams();
        formData.append('username', username);
        formData.append('password', password);

        // Для запросов на /token нужно отправлять 'application/x-www-form-urlencoded'
        // fetch API автоматически установит его при отправке URLSearchParams
        const response = await fetch(`${API_BASE_URL}/api/token`, { // <--- ИСПРАВЛЕНО ЗДЕСЬ!
            method: 'POST',
            body: formData, // URLSearchParams автоматически устанавливает нужный Content-Type
        });

        if (!response.ok) {
            let errorData = await response.json(); // Ошибки логина обычно в JSON
            throw new ApiError(response.status, errorData.detail || response.statusText);
        }
        return await response.json();
    },
    // --->

    setToken: (token) => {
        localStorage.setItem('accessToken', token);
    },

    clearToken: () => {
        localStorage.removeItem('accessToken');
    }
};

export { apiService, ApiError };