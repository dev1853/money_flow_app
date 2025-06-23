# backend/Dockerfile

# Используем официальный легковесный образ Python
FROM python:3.9-slim

# Устанавливаем рабочую директорию в контейнере
WORKDIR /app

# Устанавливаем переменные окружения, чтобы Python не буферизовал вывод
ENV PYTHONDONTWRITEBYTECODE 1
ENV PYTHONUNBUFFERED 1

# Копируем файл с зависимостями
COPY requirements.txt .

# Обновляем pip и устанавливаем зависимости из requirements.txt
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir -r requirements.txt

# Копируем весь код бэкенда в рабочую директорию
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