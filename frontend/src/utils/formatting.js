// frontend/src/utils/formatting.js

/**
 * Безопасно форматирует числовое значение в строку валюты (RUB).
 * Если значение не является числом, вернет "0.00 ₽".
 * @param {number | string | null | undefined} value - Значение для форматирования.
 * @returns {string} - Отформатированная строка валюты.
 */
export const formatCurrency = (value) => {
  // Превращаем любое значение в число, если это невозможно - будет 0.
  const number = Number(value) || 0;

  // Используем встроенный в браузер Intl.NumberFormat для корректного форматирования.
  return new Intl.NumberFormat('ru-RU', {
    style: 'currency',
    currency: 'RUB',
    minimumFractionDigits: 2, // Всегда показывать копейки
  }).format(number);
};