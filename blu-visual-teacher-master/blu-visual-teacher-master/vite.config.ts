import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    strictPort: false,
    proxy: {
      // The local backend contract. When the backend is not running the
      // app falls back to its labelled sample lesson instead of failing.
      '/api': {
        target: process.env.BLU_BACKEND ?? 'http://127.0.0.1:8788',
        changeOrigin: true,
      },
    },
  },
  build: {
    target: 'es2020',
    sourcemap: false,
  },
});