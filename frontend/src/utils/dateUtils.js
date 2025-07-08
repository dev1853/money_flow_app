// frontend/src/utils/dateUtils.js

import { endOfMonth, startOfMonth, format } from 'date-fns'; // <-- ИСПРАВЛЕНИЕ: Добавлен импорт startOfMonth и format

/**
 * Возвращает объект с датами начала и конца текущего календарного квартала.
 * @returns {{startDate: Date, endDate: Date}}
 */
export const getCurrentQuarterDates = () => {
  const now = new Date();
  const currentMonth = now.getMonth(); // 0-indexed (0 = Jan, 11 = Dec)
  const currentYear = now.getFullYear();

  let quarterStartMonth;
  if (currentMonth >= 0 && currentMonth <= 2) { // Q1: Jan-Mar
    quarterStartMonth = 0;
  } else if (currentMonth >= 3 && currentMonth <= 5) { // Q2: Apr-Jun
    quarterStartMonth = 3;
  } else if (currentMonth >= 6 && currentMonth <= 8) { // Q3: Jul-Sep
    quarterStartMonth = 6;
  } else { // Q4: Oct-Dec
    quarterStartMonth = 9;
  }

  const startDate = new Date(currentYear, quarterStartMonth, 1);
  const endDate = endOfMonth(new Date(currentYear, quarterStartMonth + 2)); 

  return { startDate, endDate };
};

// <-- НОВОЕ: Добавляем функции для работы с датами

/**
 * Возвращает текущую дату в формате 'YYYY-MM-DD'.
 * @returns {string} Текущая дата.
 */
export const getToday = () => {
  return format(new Date(), 'yyyy-MM-dd');
};

/**
 * Возвращает первый день месяца для заданной даты в формате 'YYYY-MM-DD'.
 * @param {Date} date - Дата.
 * @returns {string} Первый день месяца.
 */
export const getStartOfMonth = (date) => {
  return format(startOfMonth(date), 'yyyy-MM-dd');
};

/**
 * Возвращает последний день месяца для заданной даты в формате 'YYYY-MM-DD'.
 * @param {Date} date - Дата.
 * @returns {string} Последний день месяца.
 */
export const getEndOfMonth = (date) => {
  return format(endOfMonth(date), 'yyyy-MM-dd');
};

// Сюда в будущем можно будет добавлять другие функции для работы с датами