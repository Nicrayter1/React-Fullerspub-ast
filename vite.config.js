import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  base: '/bar-stock-app/', // Замените на название вашего репозитория
  build: {
    outDir: 'dist',
    sourcemap: false,
    minify: 'terser'
  }
})
