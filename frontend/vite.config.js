import { defineConfig } from 'vite'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    tailwindcss(),
    react()
  ],
  server: {
    // Эта опция гарантирует, что сервер Vite слушает на всех сетевых интерфейсах
    // внутри контейнера. Мы уже сделали это через флаг --host в docker-compose,
    // но указать это здесь — хорошая практика.
    host: '0.0.0.0',

    // Указываем Vite, что запросы с нашего домена безопасны.
    // Это и есть исправление нашей ошибки.
    allowedHosts: [
      'money.dev1853.ru'
    ],
    
    // Явно указываем порт, чтобы он совпадал с тем, что в docker-compose
    port: 3000,
  },
});