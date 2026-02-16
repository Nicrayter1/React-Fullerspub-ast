import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: './src/test/setup.js',
    css: true,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      include: ['src/components/**/*.{jsx,js}', 'src/utils/**/*.js', 'src/ProductList.jsx'],
      exclude: ['src/components/tests/**', 'src/utils/tests/**', 'src/test/**', 'src/api/**']
    }
  },
})
