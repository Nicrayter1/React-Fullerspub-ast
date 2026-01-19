export default defineConfig({
  plugins: [react()],
  base: '/React-Fullerspub-ast/',
  build: {
    sourcemap: false, // <- Это решит проблему
  }
})
