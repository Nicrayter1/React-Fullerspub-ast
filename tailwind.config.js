/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'media',
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#3b82f6',
          hover: '#2563eb',
          dark: '#60a5fa',
        },
        secondary: {
          DEFAULT: '#6b7280',
          hover: '#4b5563',
          dark: '#9ca3af',
        },
        success: {
          DEFAULT: '#10b981',
          hover: '#059669',
        },
        error: {
          DEFAULT: '#ef4444',
          hover: '#dc2626',
        },
        warning: {
          DEFAULT: '#f59e0b',
          hover: '#d97706',
        },
        surface: {
          light: '#ffffff',
          dark: '#1f2937',
        },
        background: {
          light: '#f3f4f6',
          dark: '#111827',
        }
      },
      animation: {
        'shake': 'shake 0.5s ease-in-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'slide-up-slow': 'slideUp 0.5s ease-out',
        'fade-in': 'fadeIn 0.3s ease-out',
        'spin-slow': 'spin 3s linear infinite',
        'progress': 'progress 5s linear forwards',
      },
      keyframes: {
        shake: {
          '0%, 100%': { transform: 'translateX(0)' },
          '10%, 30%, 50%, 70%, 90%': { transform: 'translateX(-5px)' },
          '20%, 40%, 60%, 80%': { transform: 'translateX(5px)' },
        },
        slideUp: {
          'from': { opacity: '0', transform: 'translateY(10px)' },
          'to': { opacity: '1', transform: 'translateY(0)' },
        },
        fadeIn: {
          'from': { opacity: '0' },
          'to': { opacity: '1' },
        },
        progress: {
          'from': { width: '100%' },
          'to': { width: '0%' },
        }
      },
      boxShadow: {
        'soft': '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
        'heavy': '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
      }
    },
  },
  plugins: [],
}
