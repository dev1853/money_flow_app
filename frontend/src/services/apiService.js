// frontend/src/services/apiService.js
import { API_BASE_URL } from '../apiConfig';

class ApiError extends Error {
  constructor(message, status, data) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.data = data || { detail: message };
  }
}

async function request(endpoint, options = {}) {
  const token = localStorage.getItem('accessToken');
  const config = {
    method: options.method || 'GET',
    headers: {
      ...options.headers,
    },
  };

  if (token) {
    config.headers['Authorization'] = `Bearer ${token}`;
  }

  // Улучшенная обработка тела запроса и Content-Type
  if (options.body) {
    if (options.body instanceof FormData) {
      // Для FormData браузер сам установит Content-Type, удаляем его, если был задан вручную
      delete config.headers['Content-Type'];
      config.body = options.body;
    } else if (typeof options.body === 'string' || options.body instanceof URLSearchParams) {
      // Если тело уже строка или URLSearchParams, используем как есть.
      // Content-Type должен быть установлен в options.headers, если это необходимо (например, application/x-www-form-urlencoded)
      config.body = options.body.toString(); // Убедимся, что это строка для URLSearchParams
      if (options.headers && options.headers['Content-Type']) {
        config.headers['Content-Type'] = options.headers['Content-Type'];
      } else if (options.body instanceof URLSearchParams && !config.headers['Content-Type']) {
        // Устанавливаем по умолчанию для URLSearchParams, если не задано иное
        config.headers['Content-Type'] = 'application/x-www-form-urlencoded;charset=UTF-8';
      }
    } else if (typeof options.body === 'object') {
      // Для остальных объектов по умолчанию JSON
      config.headers['Content-Type'] = 'application/json';
      config.body = JSON.stringify(options.body);
    }
  }


  const response = await fetch(`${API_BASE_URL}${endpoint}`, config);

  if (!response.ok) {
    let errorData;
    const contentType = response.headers.get("content-type");
    if (contentType && contentType.includes("application/json")) {
      try {
        errorData = await response.json();
      } catch (e) {
        errorData = { detail: response.statusText || `Request failed with status ${response.status}` };
      }
    } else {
      const textError = await response.text();
      errorData = { detail: textError || response.statusText || `Request failed with status ${response.status}` };
    }
    throw new ApiError(
      errorData.detail || `API Error: ${response.status}`,
      response.status,
      errorData
    );
  }

  if (response.status === 204 || response.headers.get("content-length") === "0") {
    return null;
  }

  const contentType = response.headers.get("content-type");
  if (contentType && contentType.includes("application/json")) {
    return response.json();
  }
  
  return response.text();
}

export const apiService = {
  get: (endpoint, options = {}) => request(endpoint, { ...options, method: 'GET' }),
  post: (endpoint, body, options = {}) => request(endpoint, { ...options, method: 'POST', body }),
  put: (endpoint, body, options = {}) => request(endpoint, { ...options, method: 'PUT', body }),
  patch: (endpoint, body, options = {}) => request(endpoint, { ...options, method: 'PATCH', body }),
  del: (endpoint, options = {}) => request(endpoint, { ...options, method: 'DELETE' }),
};

export { ApiError };