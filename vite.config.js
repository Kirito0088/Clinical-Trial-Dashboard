import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        landing: resolve(__dirname, 'landing.html'),
      }
    }
  },
  server: {
    port: 5173,
    host: true,
    open: false,
    proxy: {
      // Transparently forward /api/* → Express backend on :4000
      '/api': {
        target: 'http://localhost:4000',
        changeOrigin: true,
        secure: false,
      },
    },
    watch: {
      ignored: ['**/*.mp4', '**/*.mov', '**/*.avi', '**/*.webm', '**/LandingPage/**', '**/.git/**']
    }
  }
});
