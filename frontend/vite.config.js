// /frontend/vite.config.js

import { defineConfig } from 'vite';
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [
    tailwindcss(),
    react()
  ],
  server: {
    host: '0.0.0.0', // Оставляем эту настройку для Docker
    port: 3000,      // Явно указываем порт для разработки

    // --- ДОБАВЬТЕ ЭТОТ БЛОК ---
    proxy: {
      // Все запросы, начинающиеся с '/api', будут перенаправлены
      '/api': {
        // Указываем, куда перенаправлять (на ваш работающий бэкенд)
        target: 'http://localhost:8000',
        // Обязательная опция для корректной работы прокси
        changeOrigin: true,
      },
    },
  },
});