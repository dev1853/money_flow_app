// frontend/src/utils/formatting.js

/**
 * Форматирует число в денежную строку в соответствии с русской локалью.
 * @param {number | string | null | undefined} amount - Сумма для форматирования.
 * @returns {string} - Отформатированная строка (например, "1 234,56 ₽") или "N/A".
 */
export const formatCurrency = (amount) => {
  const number = parseFloat(amount);
  if (isNaN(number)) {
    return 'N/A'; // Возвращаем 'N/A' если значение не является числом
  }
  return new Intl.NumberFormat('ru-RU', {
    style: 'currency',
    currency: 'RUB',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(number);
};


// --- ДОБАВЬТЕ ЭТУ ФУНКЦИЮ ---
/**
 * Форматирует дату в локализованный строковый формат (ДД.ММ.ГГГГ).
 * @param {string | Date} dateString - Строка с датой или объект Date.
 * @returns {string} - Отформатированная дата.
 */
export const formatDate = (dateString) => {
  if (!dateString) {
    return '...';
  }
  const date = new Date(dateString);
  // Используем toLocaleDateString для корректного отображения в разных часовых поясах
  return date.toLocaleDateString('ru-RU', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
};