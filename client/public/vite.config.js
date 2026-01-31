// client/vite.config.js
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from 'tailwindcss';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    host: '0.0.0.0',
    port: 5173,
    proxy: {
      // Directs standard API calls to Flask
      '/api': {
        target: 'http://127.0.0.1:5000', 
        changeOrigin: true,
        secure: false,
        // rewrite: (path) => path
      },
      // Directs WebSocket traffic to Flask-SocketIO
      '/socket.io': {
        target: 'http://127.0.0.1:5000',
        ws: true, // Enables WebSocket proxying
        changeOrigin: true,
        secure: false,
      }
    }
  }
});