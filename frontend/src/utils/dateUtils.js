// frontend/src/utils/dateUtils.js

import { endOfMonth } from 'date-fns';

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
  // Конец 3-го месяца квартала
  const endDate = endOfMonth(new Date(currentYear, quarterStartMonth + 2)); 

  return { startDate, endDate };
};

// Сюда в будущем можно будет добавлять другие функции для работы с датами