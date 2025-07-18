#!/bin/bash

# Скрипт для настройки переменных окружения
# Использование: ./setup-env.sh

echo "🔧 Настройка переменных окружения для Money Flow App"
echo ""

# Проверяем, существует ли уже .env файл
if [ -f .env ]; then
    echo "⚠️  Файл .env уже существует."
    read -p "Хотите перезаписать его? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "❌ Отменено."
        exit 1
    fi
fi

# Запрашиваем IP сервера
echo ""
echo "🌐 Введите IP адрес вашего сервера:"
echo "   Примеры: 192.168.1.100, 10.0.0.5, your-domain.com"
read -p "IP сервера: " SERVER_IP

if [ -z "$SERVER_IP" ]; then
    echo "❌ IP сервера не может быть пустым!"
    exit 1
fi

# Запрашиваем пароль для PostgreSQL
echo ""
echo "🔐 Введите пароль для PostgreSQL (или нажмите Enter для использования дефолтного):"
read -s -p "Пароль PostgreSQL: " DB_PASSWORD
echo

if [ -z "$DB_PASSWORD" ]; then
    DB_PASSWORD="Ghbdtnjvktn"
    echo "✅ Используется дефолтный пароль: $DB_PASSWORD"
fi

# Генерируем новый секретный ключ
echo ""
echo "🔑 Генерируем новый секретный ключ..."
NEW_SECRET_KEY=$(python3 -c "import secrets; print(secrets.token_hex(32))" 2>/dev/null || openssl rand -hex 32)

# Создаём .env файл
echo ""
echo "📝 Создаём .env файл..."

cat > .env << EOF
# Database Configuration
POSTGRES_USER=postgres
POSTGRES_PASSWORD=$DB_PASSWORD
POSTGRES_DB=money_flow_db
DATABASE_URL=postgresql://postgres:$DB_PASSWORD@postgres:5432/money_flow_db

# Security
SECRET_KEY=$NEW_SECRET_KEY
ALGORITHM=HS256

# Frontend Configuration
VITE_API_BASE_URL=http://$SERVER_IP:8000/api

# Production Settings
NODE_ENV=production
PYTHON_ENV=production
EOF

echo "✅ Файл .env создан успешно!"
echo ""
echo "📋 Настройки:"
echo "   IP сервера: $SERVER_IP"
echo "   Пароль PostgreSQL: $DB_PASSWORD"
echo "   Секретный ключ: $NEW_SECRET_KEY"
echo ""
echo "🚀 Теперь можете запустить деплой: ./deploy.sh" 