// frontend/src/apiConfig.js

const API_BASE_URL = (import.meta.env.VITE_API_URL || 'http://localhost:8001') + '/api';

// Экспортируем переменную как значение по умолчанию
export default API_BASE_URL;