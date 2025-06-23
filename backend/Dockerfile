# money_flow_app/docker-compose.yml
version: '3.8'

services:
  postgres:
    image: postgres:13-alpine
    environment:
      POSTGRES_USER: postgres       # ЗАМЕНИТЕ НА СВОЕГО ПОЛЬЗОВАТЕЛЯ БД
      POSTGRES_PASSWORD: Ghbdtnjvktn  # ЗАМЕНИТЕ НА СВОЙ ПАРОЛЬ БД
      POSTGRES_DB: money_flow_db             # ЗАМЕНИТЕ НА СВОЮ БАЗУ ДАННЫХ
    ports:
      - "3000:3000"
    volumes:
      - postgres_data:/var/lib/postgresql/data

  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile
    # Порт 8001 внутри контейнера, который будет слушать FastAPI
    ports:
      - "8001:8001" # Маппинг порта 8001 хоста на порт 8001 контейнера
    environment:
      # ВАЖНО: Эти переменные окружения должны быть заменены на реальные значения
      # Для Docker Compose, DATABASE_URL обычно указывает на имя сервиса postgres
      DATABASE_URL: postgresql://your_db_user:your_db_password@postgres:5432/money_flow_db # ЗАМЕНИТЕ!
      SECRET_KEY: your_super_secret_key_for_jwt        # ЗАМЕНИТЕ НА СВОЙ СЕКРЕТНЫЙ КЛЮЧ (длинный, случайный)
      ALGORITHM: HS256                     
    depends_on:
      - postgres # Убедимся, что база данных запущена до бэкенда

  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile
    # НОВОЕ: Фронтенд теперь отдается Nginx на порту 80 внутри контейнера.
    # Маппим порт 80 хоста на порт 80 контейнера Nginx.
    # Если порт 80 занят, используйте другой, например "8080:80".
    ports:
      - "80:80" # <--- ИЗМЕНЕНО: Порт Nginx
    environment:
      # Этот URL должен указывать на бэкенд, доступный из БРАУЗЕРА (через публичный IP или localhost)
      VITE_API_BASE_URL: http://localhost:8001  # <--- ДЛЯ ЛОКАЛЬНОЙ РАЗРАБОТКИ
      # Для ПРОДАКШЕНА на сервере, если фронтенд и бэкенд на одном сервере, 
      # и бэкенд мапится на порт 8001, то это может быть:
      # VITE_API_BASE_URL: http://ВАШ_СЕРВЕРНЫЙ_IP:8001
      # ИЛИ:
      # VITE_API_BASE_URL: http://localhost:8001 (если трафик с фронтенд контейнера к бэкенд контейнеру идет через хост сеть)
      # В продакшене лучше использовать доменное имя или внутреннюю сеть Docker (см. примечание ниже)
    depends_on:
      - backend # Убедимся, что бэкенд запущен до фронтенда (хотя для Nginx не так критично)

volumes:
  postgres_data: