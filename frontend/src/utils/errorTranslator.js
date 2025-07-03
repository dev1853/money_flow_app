// frontend/src/utils/errorTranslator.js

/**
 * Переводит технические ошибки аутентификации на понятный русский язык.
 * @param {string} technicalError - Техническое сообщение об ошибке от сервера.
 * @returns {string} - Человекопонятное сообщение об ошибке на русском.
 */
export const translateAuthError = (technicalError) => {
  if (!technicalError) {
    return 'Произошла неизвестная ошибка. Пожалуйста, попробуйте позже.';
  }

  const lowerCaseError = technicalError.toLowerCase();

  // Здесь мы будем добавлять известные нам ошибки
  // ЗАМЕТКА: Эти строки - всего лишь примеры. Нам нужны реальные ошибки с вашего сервера.
  if (lowerCaseError.includes('invalid credentials') || lowerCaseError.includes('incorrect username or password')) {
    return 'Неверный логин или пароль. Пожалуйста, проверьте введенные данные.';
  }
  
  if (lowerCaseError.includes('user with this email already exists')) {
    return 'Пользователь с таким email уже зарегистрирован.';
  }

  if (lowerCaseError.includes('password should be at least 8 characters')) {
    return 'Пароль должен содержать не менее 8 символов.';
  }

  // Если мы не знаем, что это за ошибка, возвращаем общее сообщение.
  return 'Произошла непредвиденная ошибка. Пожалуйста, попробуйте еще раз.';
};