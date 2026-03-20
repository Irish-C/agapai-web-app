// client/vite.config.js
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    host: '127.0.0.1',
    port: 5173,
    strictPort: true, // Fail if port 5173 is unavailable (prevents auto-switching to 5174/5273)
    proxy: {
      // Directs standard API calls to FastAPI
      '/api': {
        target: 'http://127.0.0.1:5000', 
        changeOrigin: true,
        secure: false,
        // rewrite: (path) => path
      },
      // Directs video feed stream to FastAPI
      '/video_feed': {
        target: 'http://127.0.0.1:5000',
        changeOrigin: true,
        secure: false,
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