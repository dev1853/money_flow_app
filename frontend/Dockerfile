FROM node:18-alpine

WORKDIR /app

# Копируем package.json и lock-файл для установки зависимостей
COPY package*.json ./

RUN npm install

# Копируем остальные файлы проекта
COPY . .

# Собираем проект (если нужен production билд)
RUN npm run build

# Запускаем dev сервер Vite
CMD ["npm", "run", "dev"]
