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
    port: 3000, // <--- Попробуй, например, порт 3000
    // host: true // Если хочешь, чтобы был доступен по сети (например, с мобильного)
  }
});