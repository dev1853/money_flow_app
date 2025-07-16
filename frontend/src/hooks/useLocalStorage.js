import { useState, useEffect } from 'react';

// Эта функция помогает нам безопасно парсить JSON из localStorage
function getSavedValue(key, initialValue) {
  const savedValue = localStorage.getItem(key);

  // Если значение найдено в localStorage, парсим его
  if (savedValue) {
    try {
      return JSON.parse(savedValue);
    } catch (e) {
      console.error(`Ошибка парсинга JSON из localStorage для ключа "${key}":`, e);
      return initialValue;
    }
  }

  // Если значение было функцией (для ленивой инициализации), вызываем ее
  if (initialValue instanceof Function) {
    return initialValue();
  }

  // В противном случае возвращаем начальное значение
  return initialValue;
}

export function useLocalStorage(key, initialValue) {
  // Используем useState, инициализируя его значением из localStorage
  const [value, setValue] = useState(() => {
    return getSavedValue(key, initialValue);
  });

  // Используем useEffect, чтобы обновлять localStorage каждый раз,
  // когда `value` или `key` изменяются.
  useEffect(() => {
    // Не сохраняем null или undefined, чтобы не засорять localStorage
    if (value === undefined || value === null) {
      localStorage.removeItem(key);
    } else {
      localStorage.setItem(key, JSON.stringify(value));
    }
  }, [key, value]);

  return [value, setValue];
}