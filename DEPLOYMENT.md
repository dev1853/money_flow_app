# Инструкция по развёртыванию Money Flow App

## Требования к серверу

- Ubuntu 20.04+ или CentOS 7+
- Docker 20.10+
- Docker Compose 2.0+
- Минимум 2GB RAM
- 10GB свободного места

## 1. Подготовка сервера

### Установка Docker
```bash
# Обновляем систему
sudo apt update && sudo apt upgrade -y

# Устанавливаем Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Добавляем пользователя в группу docker
sudo usermod -aG docker $USER

# Устанавливаем Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/download/v2.20.0/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Перезагружаем систему
sudo reboot
```

### Создание директории проекта
```bash
# Создаём директорию для проекта
mkdir -p /opt/money-flow-app
cd /opt/money-flow-app

# Клонируем репозиторий
git clone https://github.com/dev1853/money_flow_app.git .
```

## 2. Настройка переменных окружения

### Создание .env файла
```bash
# Создаём .env файл
cat > .env << EOF
# Database
POSTGRES_USER=postgres
POSTGRES_PASSWORD=your_secure_password_here
POSTGRES_DB=money_flow_db
DATABASE_URL=postgresql://postgres:your_secure_password_here@postgres:5432/money_flow_db

# Security
SECRET_KEY=your_secret_key_here_64_chars_long
ALGORITHM=HS256

# Frontend
VITE_API_BASE_URL=http://your-server-ip:8000/api
EOF
```

### Генерация SECRET_KEY
```bash
# Генерируем безопасный SECRET_KEY
python3 -c "import secrets; print(secrets.token_hex(32))"
```

## 3. Обновление docker-compose.yml

Замените значения в docker-compose.yml на переменные из .env:

```yaml
services:
  postgres:
    environment:
      POSTGRES_USER: ${POSTGRES_USER}
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
      POSTGRES_DB: ${POSTGRES_DB}

  backend:
    environment:
      DATABASE_URL: ${DATABASE_URL}
      SECRET_KEY: ${SECRET_KEY}
      ALGORITHM: ${ALGORITHM}
```

## 4. Запуск системы

### Первый запуск
```bash
# Останавливаем все контейнеры (если есть)
docker-compose down

# Удаляем старые образы (если есть)
docker-compose down --rmi all

# Собираем и запускаем контейнеры
docker-compose up -d --build

# Проверяем статус
docker-compose ps

# Смотрим логи
docker-compose logs -f
```

### Проверка работоспособности
```bash
# Проверяем, что все сервисы запущены
docker-compose ps

# Проверяем доступность backend
curl http://localhost:8000/docs

# Проверяем доступность frontend
curl http://localhost:3000

# Проверяем подключение к БД
docker-compose exec postgres psql -U postgres -d money_flow_db -c "\dt"
```

## 5. Настройка Nginx (опционально)

### Установка Nginx
```bash
sudo apt install nginx -y
```

### Создание конфигурации
```bash
sudo nano /etc/nginx/sites-available/money-flow-app
```

```nginx
server {
    listen 80;
    server_name your-domain.com;

    # Frontend
    location / {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Backend API
    location /api/ {
        proxy_pass http://localhost:8000/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

### Активация сайта
```bash
sudo ln -s /etc/nginx/sites-available/money-flow-app /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

## 6. Настройка SSL (опционально)

### Установка Certbot
```bash
sudo apt install certbot python3-certbot-nginx -y
```

### Получение SSL сертификата
```bash
sudo certbot --nginx -d your-domain.com
```

## 7. Управление системой

### Полезные команды
```bash
# Остановить все сервисы
docker-compose down

# Запустить все сервисы
docker-compose up -d

# Перезапустить конкретный сервис
docker-compose restart backend

# Посмотреть логи
docker-compose logs -f backend

# Обновить код и перезапустить
git pull
docker-compose up -d --build

# Создать резервную копию БД
docker-compose exec postgres pg_dump -U postgres money_flow_db > backup.sql

# Восстановить БД из резервной копии
docker-compose exec -T postgres psql -U postgres money_flow_db < backup.sql
```

## 8. Мониторинг

### Проверка ресурсов
```bash
# Использование диска
df -h

# Использование памяти
free -h

# Использование CPU
htop

# Логи Docker
docker system df
docker stats
```

## 9. Устранение неполадок

### Частые проблемы

1. **БД не подключается**
   ```bash
   docker-compose logs postgres
   docker-compose exec postgres pg_isready -U postgres
   ```

2. **Backend не запускается**
   ```bash
   docker-compose logs backend
   docker-compose exec backend alembic current
   ```

3. **Frontend не отображается**
   ```bash
   docker-compose logs frontend
   curl http://localhost:3000
   ```

### Сброс к начальному состоянию
```bash
# Остановить все контейнеры
docker-compose down

# Удалить все данные
docker-compose down -v
docker system prune -a

# Запустить заново
docker-compose up -d --build
```

## 10. Безопасность

### Рекомендации
- Измените пароли по умолчанию
- Настройте firewall
- Регулярно обновляйте систему
- Настройте резервное копирование
- Мониторьте логи на предмет подозрительной активности

### Firewall
```bash
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable
``` 