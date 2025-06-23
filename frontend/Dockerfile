 frontend/Dockerfile

# --- СТАДИЯ 1: Сборка приложения ---
FROM node:20-alpine AS build-stage
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

# --- СТАДИЯ 2: Рабочий образ ---
FROM nginx:stable-alpine
COPY --from=build-stage /app/dist /usr/share/nginx/html

COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]