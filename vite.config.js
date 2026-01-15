import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: '/React-Fullerspub-ast/', // Имя вашего репозитория
})
