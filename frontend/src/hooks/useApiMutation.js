import { useState, useCallback } from 'react';
import { ApiError } from '../services/apiService';

export const useApiMutation = (mutationFunction, { onSuccess, onError } = {}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const mutate = useCallback(async (...args) => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await mutationFunction(...args);
      if (onSuccess) {
        onSuccess(result);
      }
      return { success: true, data: result };
    } catch (err) {
      console.error("API Mutation Error:", err);
      let errorMessage = 'Произошла неизвестная ошибка.';
      if (err instanceof ApiError && err.data?.detail) {
          errorMessage = typeof err.data.detail === 'string' ? err.data.detail : JSON.stringify(err.data.detail);
      } else if (err.message) {
          errorMessage = err.message;
      }
      setError(errorMessage);
      if (onError) {
        onError(errorMessage);
      }
      return { success: false, error: errorMessage };
    } finally {
      setIsLoading(false);
    }
  }, [mutationFunction, onSuccess, onError]);

  return [mutate, isLoading, error];
};