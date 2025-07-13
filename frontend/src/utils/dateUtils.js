// frontend/src/utils/dateUtils.js

/**
 * Форматирует дату в строку формата DD.MM.YYYY.
 * Эту функцию можно использовать для отображения даты в UI.
 * @param {string|Date} dateInput - Строка даты (ISO) или объект Date.
 * @returns {string} - Отформатированная строка даты.
 */
export function formatDate(dateInput) { // Убедитесь, что здесь есть `export`
    if (!dateInput) return '';
    const date = new Date(dateInput);
    // Проверяем на невалидную дату
    if (isNaN(date.getTime())) {
        return '';
    }
    return date.toLocaleDateString('ru-RU', { year: 'numeric', month: '2-digit', day: '2-digit' });
}


/**
 * Возвращает первый день месяца для указанной даты.
 * @param {Date} date - Исходная дата.
 * @returns {Date} - Новый объект Date, представляющий первое число месяца.
 */
export const getFirstDayOfMonth = (date) => {
    const newDate = new Date(date.getFullYear(), date.getMonth(), 1);
    newDate.setHours(0, 0, 0, 0);
    return newDate;
};

/**
 * Возвращает последний день месяца для указанной даты.
 * @param {Date} date - Исходная дата.
 * @returns {Date} - Новый объект Date, представляющий последнее число месяца.
 */
export const getLastDayOfMonth = (date) => {
    const newDate = new Date(date.getFullYear(), date.getMonth() + 1, 0);
    newDate.setHours(23, 59, 59, 999);
    return newDate;
};

/**
 * Форматирует дату в строку формата YYYY-MM-DD.
 * Эта функция нужна для отправки данных в API.
 * @param {Date} date - Объект Date для форматирования.
 * @returns {string} - Дата в виде строки 'YYYY-MM-DD'.
 */
export const toISODateString = (date) => {
    if (!date || !(date instanceof Date)) {
        return '';
    }
    return date.toISOString().split('T')[0];
};

/**
 * Возвращает объект с датами начала и конца текущего календарного квартала.
 * @returns {{startDate: Date, endDate: Date}}
 */
export const getCurrentQuarterDates = () => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    let quarterStartMonth;
    if (currentMonth < 3) {
        quarterStartMonth = 0; // Q1
    } else if (currentMonth < 6) {
        quarterStartMonth = 3; // Q2
    } else if (currentMonth < 9) {
        quarterStartMonth = 6; // Q3
    } else {
        quarterStartMonth = 9; // Q4
    }

    const startDate = new Date(currentYear, quarterStartMonth, 1);
    const endDate = new Date(currentYear, quarterStartMonth + 3, 0);

    startDate.setHours(0, 0, 0, 0);
    endDate.setHours(23, 59, 59, 999);

    return { startDate, endDate };
};