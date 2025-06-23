# frontend/Dockerfile

# --- СТАДИЯ 1: Сборка приложения ---
# Используем образ Node.js для установки зависимостей и сборки проекта
FROM node:20-alpine AS build-stage

# Устанавливаем рабочую директорию
WORKDIR /app

# Копируем package.json и package-lock.json для установки зависимостей
COPY package*.json ./

# Устанавливаем зависимости
RUN npm install

# Копируем весь остальной код приложения
COPY . .

# Запускаем команду сборки, которая создаст папку /app/dist
RUN npm run build

# --- СТАДИЯ 2: Рабочий образ ---
# Используем легковесный образ Nginx
FROM nginx:stable-alpine

# Копируем собранные файлы из стадии сборки в публичную папку Nginx
COPY --from=build-stage /app/dist /usr/share/nginx/html

# Копируем кастомную конфигурацию Nginx для корректной работы React Router
# Этот файл мы создадим следующим шагом
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Указываем, что контейнер будет слушать на порту 80
EXPOSE 80

# Команда для запуска Nginx
CMD ["nginx", "-g", "daemon off;"]