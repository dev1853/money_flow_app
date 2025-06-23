# money_flow_app/backend/Dockerfile

# Используем официальный образ Python как базовый
FROM python:3.9-slim-buster

# Устанавливаем рабочую директорию внутри контейнера
WORKDIR /app

# Копируем файл зависимостей Python
# Сначала копируем только requirements.txt для эффективного кеширования слоев Docker
COPY requirements.txt .

# Устанавливаем зависимости Python
RUN pip install --no-cache-dir -r requirements.txt

# Копируем остальной код приложения в рабочую директорию
COPY . .

# Открываем порт, который использует ваше FastAPI-приложение (по умолчанию 8001)
EXPOSE 8001

# Команда для запуска приложения с Uvicorn
# --host 0.0.0.0 делает приложение доступным извне контейнера
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8001"]