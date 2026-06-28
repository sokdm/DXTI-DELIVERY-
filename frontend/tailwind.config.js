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
        dhl: {
          yellow: '#FFCC00',
          'yellow-light': '#FFE033',
          'yellow-dark': '#E6B800',
          red: '#D40511',
          'red-dark': '#B0040E',
          black: '#1A1A1A',
          'gray-900': '#0F172A',
          'gray-800': '#1E293B',
          'gray-700': '#334155',
          'gray-600': '#475569',
          'gray-500': '#64748B',
          'gray-400': '#94A3B8',
          'gray-300': '#CBD5E1',
          'gray-200': '#E2E8F0',
          'gray-100': '#F1F5F9',
          'gray-50': '#F8FAFC',
          white: '#FFFFFF',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['Inter', 'system-ui', 'sans-serif'],
      },
      animation: {
        'float': 'float 6s ease-in-out infinite',
        'pulse-slow': 'pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'slide-up': 'slideUp 0.5s ease-out',
        'fade-in': 'fadeIn 0.5s ease-out',
        'bounce-slow': 'bounce 3s infinite',
        'truck-move': 'truckMove 20s linear infinite',
        'shimmer': 'shimmer 2s linear infinite',
        'progress': 'progress 1.5s ease-in-out forwards',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-20px)' },
        },
        slideUp: {
          '0%': { transform: 'translateY(20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        truckMove: {
          '0%': { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(100vw)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        progress: {
          '0%': { width: '0%' },
          '100%': { width: 'var(--progress-width)' },
        },
      },
    },
  },
  plugins: [],
}
