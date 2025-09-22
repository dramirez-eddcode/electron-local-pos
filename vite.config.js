import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss()
  ],
  base: './',
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@shared': path.resolve(__dirname, './src/shared'),
      '@renderer': path.resolve(__dirname, './src/renderer'),
      '@main': path.resolve(__dirname, './src/main')
    }
  },
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    target: 'esnext'
  },
  server: {
    port: 5173
  },
  define: {
    // Para compatibilidad con algunas librerías
    global: 'globalThis'
  },
  // Configuración para servir assets estáticos
  publicDir: 'public',
  assetsInclude: ['**/*.png', '**/*.jpg', '**/*.jpeg', '**/*.gif', '**/*.svg']
})