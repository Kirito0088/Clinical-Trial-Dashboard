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
    watch: {
      ignored: ['**/*.mp4', '**/*.mov', '**/*.avi', '**/*.webm', '**/LandingPage/**', '**/.git/**']
    }
  }
});
