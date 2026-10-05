/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        admin: {
          primary: '#00A6A6',
          secondary: '#35E0A1',
          success: '#10b981',
          warning: '#f59e0b',
          danger: '#ef4444',
          dark: '#0B1020',
          sidebar: '#0B1020',
        }
      },
    },
  },
  plugins: [],
}
