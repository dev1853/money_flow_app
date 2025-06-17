// frontend/src/services/apiService.js

import { API_BASE_URL } from '../apiConfig';

class ApiError extends Error {
  constructor(message, status) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

const apiService = {
  token: null,

  setToken(token) {
    this.token = token;
  },

  clearToken() {
    this.token = null;
  },

  // Добавили параметр 'authenticate'
  async request(endpoint, options = {}, authenticate = true) {
    const url = `${API_BASE_URL}${endpoint}`;

    const headers = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    // Проверяем 'authenticate' перед добавлением токена
    if (authenticate && this.token) {
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
        throw new ApiError(errorData.detail || `Ошибка сервера: ${response.status}`, response.status);
      }

      if (response.status === 204) {
        return null;
      }
      return response.json();

    } catch (error) {
      console.error("Ошибка API запроса:", error);
      throw error;
    }
  },

  get(endpoint, options) {
    return this.request(endpoint, { ...options, method: 'GET' });
  },

  // Обновили post, чтобы он мог принимать параметр authenticate
  post(endpoint, body, options = {}, authenticate = true) {
    const isFormData = body instanceof FormData;
    const isUrlEncoded = body instanceof URLSearchParams;

    let requestBody;
    const headers = { ...options?.headers };

    if (isFormData || isUrlEncoded) {
        requestBody = body;
        if (isFormData) {
          delete headers['Content-Type'];
        }
    } else {
        requestBody = JSON.stringify(body);
    }

    // Передаем authenticate в общий метод request
    return this.request(endpoint, { ...options, method: 'POST', body: requestBody, headers }, authenticate);
  },

  put(endpoint, body, options) {
    return this.request(endpoint, { ...options, method: 'PUT', body: JSON.stringify(body) });
  },

  delete(endpoint, options) {
    return this.request(endpoint, { ...options, method: 'DELETE' });
  },
};

export { apiService, ApiError };