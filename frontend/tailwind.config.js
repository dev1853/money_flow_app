// tailwind.config.js
/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}", // <-- Вот эта строка самая важная
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}