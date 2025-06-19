// frontend/src/services/apiService.js
import API_BASE_URL from '../apiConfig';

// Определяем класс для кастомных ошибок API
export class ApiError extends Error {
  constructor(message, status) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

const request = async (endpoint, options = {}) => {
  const url = `${API_BASE_URL}${endpoint}`;
  
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  const token = localStorage.getItem('accessToken');
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
        let errorMessage = `HTTP-ошибка! Статус: ${response.status}`;
        try {
            const errorData = await response.json();
            if (errorData.detail) {
                // FastAPI часто возвращает массив ошибок валидации в поле 'detail'
                if (Array.isArray(errorData.detail)) {
                    errorMessage = errorData.detail.map(err => {
                        // Превращаем путь к полю в строку, например "body -> name"
                        const field = err.loc.join(' → ');
                        return `${field}: ${err.msg}`; // Собираем сообщение, например "body → name: field required"
                    }).join('; ');
                } else {
                    // Если detail - это просто строка
                    errorMessage = errorData.detail;
                }
            }
        } catch (e) {
            // Если тело ответа не в формате JSON, просто используем текст
            errorMessage = await response.text();
        }
        throw new ApiError(errorMessage);
    }
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
};

export const apiService = {
  get(endpoint, params) {
    let url = endpoint;
    if (params) {
      const query = new URLSearchParams(params);
      url += `?${query.toString()}`;
    }
    return request(url);
  },

  post(endpoint, body) {
    return request(endpoint, {
      method: 'POST',
      body: JSON.stringify(body),
    });
  },

  put(endpoint, body) {
    return request(endpoint, {
      method: 'PUT',
      body: JSON.stringify(body),
    });
  },

  delete(endpoint) {
    return request(endpoint, { method: 'DELETE' });
  },

  // ДОБАВЛЯЕМ НОВЫЙ МЕТОД LOGIN
  login: (credentials) => {
    // Для OAuth2, FastAPI ожидает данные в формате x-www-form-urlencoded
    const body = new URLSearchParams();
    body.append('username', credentials.username);
    body.append('password', credentials.password);

    // Вызываем базовый метод request с правильным путем и параметрами
    return request('/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body,
    });
  },

  setToken: (token) => {
    localStorage.setItem('accessToken', token);
  },

  getToken: () => {
    return localStorage.getItem('accessToken');
  },

  clearToken: () => {
    localStorage.removeItem('accessToken');
  },
};