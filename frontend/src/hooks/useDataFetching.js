// frontend/src/hooks/useDataFetching.js

import { useState, useEffect, useCallback } from 'react';

/**
 * Кастомный хук для инкапсуляции логики запроса данных.
 * @param {Function} apiCallFunction - Асинхронная функция, которая делает запрос к API и возвращает данные.
 * @param {Array} dependencies - Массив зависимостей для useEffect. Запрос будет перезапущен при их изменении.
 * @param {Object} options - Дополнительные опции.
 * @param {boolean} options.skip - Если true, хук не будет выполнять запрос.
 * @returns {{data: any, loading: boolean, error: string | null, refetch: Function}}
 */
export const useDataFetching = (apiCallFunction, dependencies = [], options = {}) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchData = useCallback(async () => {
    // Если опция skip=true, не делаем ничего
    if (options.skip) {
      setData(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const result = await apiCallFunction();
      setData(result);
    } catch (err) {
      console.error("Ошибка в хуке useDataFetching:", err);
      setError(err.message || "Произошла ошибка при загрузке данных.");
    } finally {
      setLoading(false);
    }
  }, [...dependencies, options.skip]);  // Зависимости передаются в useCallback

  useEffect(() => {
    fetchData();
  }, [fetchData]); // useEffect зависит только от стабильной функции fetchData

  return { data, loading, error, refetch: fetchData };
};