# money_flow_app/frontend/Dockerfile

# Этап сборки (Build Stage)
FROM node:18-alpine AS build

WORKDIR /app

# Копируем package.json и package-lock.json для установки зависимостей
COPY package*.json ./

# Устанавливаем зависимости Node.js (для сборки)
RUN npm install

# Копируем остальной код фронтенда
COPY . .

# Запускаем сборку React-приложения для продакшена
# Это создаст оптимизированные статические файлы в директории 'dist'
RUN npm run build

# Этап продакшн-сервера (Production Server Stage)
FROM nginx:alpine

# Копируем собранные статические файлы из предыдущего этапа сборки
COPY --from=build /app/dist /usr/share/nginx/html

# Опционально: Копируем пользовательскую конфигурацию Nginx
# Если у вас есть специфичные настройки Nginx (например, для SPA fallback, SSL),
# создайте файл default.conf в директории frontend/ и раскомментируйте строку ниже.
# COPY ./nginx.conf /etc/nginx/conf.d/default.conf

# Открываем порт, на котором Nginx будет слушать (по умолчанию 80)
EXPOSE 80

# Команда для запуска Nginx
CMD ["nginx", "-g", "daemon off;"]