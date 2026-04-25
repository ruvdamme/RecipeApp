import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    // Serve index.html for any unknown path so browser back/forward works
    historyApiFallback: true,
    // Proxy API calls to Go backend so no CORS issues in dev
    proxy: {
      '/recipes': {
        target: 'http://172.28.66.200:8080',
        changeOrigin: true,
      },
    },
  },
});
