#!/bin/bash

# Скрипт для развёртывания Money Flow App
# Использование: ./deploy.sh

set -e  # Остановка при ошибке

echo "🚀 Начинаем развёртывание Money Flow App..."

# Проверяем наличие Docker
if ! command -v docker &> /dev/null; then
    echo "❌ Docker не установлен. Установите Docker и попробуйте снова."
    exit 1
fi

# Проверяем наличие Docker Compose
if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose не установлен. Установите Docker Compose и попробуйте снова."
    exit 1
fi

# Проверяем наличие .env файла
if [ ! -f .env ]; then
    echo "⚠️  Файл .env не найден. Создаём из продакшн настроек..."
    if [ -f env.production ]; then
        cp env.production .env
        echo "✅ Файл .env создан из env.production"
        echo "⚠️  Пожалуйста, отредактируйте .env файл с вашими настройками перед запуском!"
        echo "   Особенно важно изменить YOUR_SERVER_IP на реальный IP сервера!"
        echo "   Команда для редактирования: nano .env"
        exit 1
    elif [ -f env.example ]; then
        cp env.example .env
        echo "✅ Файл .env создан из env.example"
        echo "⚠️  Пожалуйста, отредактируйте .env файл с вашими настройками перед запуском!"
        echo "   Особенно важно изменить пароли и SECRET_KEY!"
        exit 1
    else
        echo "❌ Файлы env.production или env.example не найдены. Создайте .env файл вручную."
        exit 1
    fi
fi

# Проверяем, что в .env файле заменён YOUR_SERVER_IP
if grep -q "YOUR_SERVER_IP" .env; then
    echo "⚠️  В .env файле не заменён YOUR_SERVER_IP на реальный IP сервера!"
    echo "   Отредактируйте .env файл: nano .env"
    echo "   Замените YOUR_SERVER_IP на IP вашего сервера"
    exit 1
fi

echo "📦 Останавливаем существующие контейнеры..."
docker-compose down

echo "🧹 Очищаем старые образы..."
docker-compose down --rmi all

echo "🔨 Собираем и запускаем контейнеры..."
docker-compose up -d --build

echo "⏳ Ждём запуска сервисов..."
sleep 15

echo "🔍 Проверяем статус сервисов..."
docker-compose ps

echo "📊 Проверяем логи..."
echo "=== Логи PostgreSQL ==="
docker-compose logs postgres | tail -5

echo "=== Логи Backend ==="
docker-compose logs backend | tail -10

echo "=== Логи Frontend ==="
docker-compose logs frontend | tail -5

echo "🌐 Проверяем доступность сервисов..."

# Получаем IP сервера из .env файла
SERVER_IP=$(grep VITE_API_BASE_URL .env | cut -d'=' -f2 | sed 's|http://||' | sed 's|:8000/api||')

# Проверяем PostgreSQL
if docker-compose exec postgres pg_isready -U postgres -d money_flow_db > /dev/null 2>&1; then
    echo "✅ PostgreSQL работает"
else
    echo "❌ PostgreSQL не отвечает"
fi

# Проверяем Backend
if curl -s http://localhost:8000/docs > /dev/null; then
    echo "✅ Backend API доступен локально"
else
    echo "❌ Backend API недоступен локально"
fi

# Проверяем Frontend
if curl -s http://localhost:3000 > /dev/null; then
    echo "✅ Frontend доступен локально"
else
    echo "❌ Frontend недоступен локально"
fi

# Проверяем доступность по внешнему IP (если указан)
if [ ! -z "$SERVER_IP" ] && [ "$SERVER_IP" != "localhost" ]; then
    echo "🌐 Проверяем доступность по внешнему IP: $SERVER_IP"
    
    if curl -s --connect-timeout 5 http://$SERVER_IP:8000/docs > /dev/null; then
        echo "✅ Backend API доступен по внешнему IP"
    else
        echo "⚠️  Backend API недоступен по внешнему IP (проверьте firewall)"
    fi
    
    if curl -s --connect-timeout 5 http://$SERVER_IP:3000 > /dev/null; then
        echo "✅ Frontend доступен по внешнему IP"
    else
        echo "⚠️  Frontend недоступен по внешнему IP (проверьте firewall)"
    fi
fi

echo ""
echo "🎉 Развёртывание завершено!"
echo ""
echo "📋 Полезные команды:"
echo "   Просмотр логов: docker-compose logs -f"
echo "   Остановка: docker-compose down"
echo "   Перезапуск: docker-compose restart"
echo "   Обновление: git pull && docker-compose up -d --build"
echo ""
echo "🌐 Доступ к приложению:"
echo "   Frontend: http://localhost:3000"
echo "   Backend API: http://localhost:8000"
echo "   API Docs: http://localhost:8000/docs"
echo ""
if [ ! -z "$SERVER_IP" ] && [ "$SERVER_IP" != "localhost" ]; then
    echo "🌐 Внешний доступ:"
    echo "   Frontend: http://$SERVER_IP:3000"
    echo "   Backend API: http://$SERVER_IP:8000"
    echo "   API Docs: http://$SERVER_IP:8000/docs"
    echo ""
fi
echo "🔧 Для настройки домена и SSL смотрите DEPLOYMENT.md" 