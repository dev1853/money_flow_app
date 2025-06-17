// frontend/src/services/apiService.js
import API_BASE_URL from '../apiConfig';

let token = localStorage.getItem('accessToken');

// Определяем класс для кастомных ошибок API
export class ApiError extends Error {
  constructor(message, status) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

export const apiService = {
  setToken(newToken) {
    token = newToken;
    localStorage.setItem('accessToken', newToken);
  },
  
  getToken() {
    return token;
  },

  clearToken() {
    token = null;
    localStorage.removeItem('accessToken');
  },

  // ИЗМЕНЕНО: request становится методом объекта apiService
  async request(endpoint, options = {}) {
    const url = `${API_BASE_URL}${endpoint}`;
    
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const config = {
      ...options,
      headers,
    };

    try {
      const response = await fetch(url, config);
      if (!response.ok) {
        let errorData;
        try {
          errorData = await response.json();
        } catch (e) {
          errorData = { detail: response.statusText };
        }
        const errorMessage = errorData.detail || 'Произошла ошибка API';
        throw new ApiError(errorMessage, response.status);
      }
      // Обработка случая, когда ответ пустой (например, статус 204 No Content)
      const contentType = response.headers.get("content-type");
      if (contentType && contentType.indexOf("application/json") !== -1) {
          return await response.json();
      }
      return; 

    } catch (error) {
      console.error('Ошибка API запроса:', error);
      if (error instanceof ApiError) {
        throw error;
      }
      throw new Error('Сетевая ошибка или сервер недоступен');
    }
  },

  // ИЗМЕНЕНО: теперь все методы используют this.request
  get(endpoint, params) {
    let url = endpoint;
    if (params) {
      const query = new URLSearchParams(params);
      url += `?${query.toString()}`;
    }
    return this.request(url);
  },

  post(endpoint, body) {
    return this.request(endpoint, {
      method: 'POST',
      body: JSON.stringify(body),
    });
  },

  put(endpoint, body) {
    return this.request(endpoint, {
      method: 'PUT',
      body: JSON.stringify(body),
    });
  },

  delete(endpoint) {
    return this.request(endpoint, { method: 'DELETE' });
  },

  login(credentials) {
    const body = new URLSearchParams();
    body.append('username', credentials.username);
    body.append('password', credentials.password);

    // ИЗМЕНЕНО: вызываем request через this
    return this.request('/auth/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body,
    });
  },
};