// frontend/src/services/apiService.js

import { API_BASE_URL } from '../apiConfig';

class ApiError extends Error {
  constructor(message, status) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

// Создаем сервис как объект, который будет хранить состояние токена
const apiService = {
  token: null,

  // --- НОВЫЕ МЕТОДЫ ДЛЯ УПРАВЛЕНИЯ ТОКЕНОМ ---
  setToken(token) {
    this.token = token;
  },

  clearToken() {
    this.token = null;
  },
  // -----------------------------------------

  async request(endpoint, options = {}) {
    const url = `${API_BASE_URL}${endpoint}`;
    
    // Создаем заголовки по умолчанию
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    // Если токен есть, добавляем его в заголовки Authorization
    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    const config = {
      ...options,
      headers,
    };

    try {
      const response = await fetch(url, config);
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new ApiError(errorData.detail || `Ошибка ${response.status}`, response.status);
      }
      // Если тело ответа пустое (например, для статуса 204 No Content)
      if (response.status === 204) {
        return null; 
      }
      return await response.json();
    } catch (error) {
      console.error("Ошибка API запроса:", error);
      // Перебрасываем ошибку, чтобы ее можно было поймать в компоненте
      throw error;
    }
  },

  // --- Вспомогательные методы для GET, POST, PUT, DELETE ---
  get(endpoint, options) {
    return this.request(endpoint, { ...options, method: 'GET' });
  },

  post(endpoint, body, options) {
    // Для FormData Content-Type устанавливается браузером автоматически
    const isFormData = body instanceof FormData;
    const isUrlEncoded = body instanceof URLSearchParams;

    let requestBody;
    const headers = { ...options?.headers };
    
    if (isFormData || isUrlEncoded) {
        requestBody = body;
        // Удаляем Content-Type, чтобы браузер установил его сам с правильным boundary для FormData
        if (isFormData) delete headers['Content-Type']; 
    } else {
        requestBody = JSON.stringify(body);
    }

    return this.request(endpoint, { ...options, method: 'POST', body: requestBody, headers });
  },

  put(endpoint, body, options) {
    return this.request(endpoint, { ...options, method: 'PUT', body: JSON.stringify(body) });
  },

  delete(endpoint, options) {
    return this.request(endpoint, { ...options, method: 'DELETE' });
  },
};

export { apiService, ApiError };