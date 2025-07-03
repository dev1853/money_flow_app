import { useState, useCallback } from 'react';
// Предполагается, что apiService уже импортирован
// import { apiService, ApiError } from '../services/apiService'; // (Если еще нет)

export const useApiMutation = (mutationFn, options = {}) => {
    const [isLoading, setIsLoading] = useState(false); // Изначально false
    const [error, setError] = useState(null);
    const [data, setData] = useState(null);

    const mutate = useCallback(async (...args) => {
        setIsLoading(true);
        setError(null);
        setData(null);
        try {
            const result = await mutationFn(...args);
            setData(result);
            if (options.onSuccess) {
                options.onSuccess(result);
            }
            return result;
        } catch (err) {
            setError(err);
            if (options.onError) {
                options.onError(err);
            }
            // Перебрасываем ошибку, чтобы вызывающий код мог ее обработать
            throw err; 
        } finally {
            setIsLoading(false);
        }
    }, [mutationFn, options.onSuccess, options.onError]);

    return [mutate, isLoading, error, data];
};