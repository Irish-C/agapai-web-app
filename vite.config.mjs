import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Configure Vite for React project
export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0', 
    port: 5173,      
    // Configure proxies for Flask backend REST API and SocketIO WebSocket
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
        secure: false,
      },
      '/socket.io': {
        target: 'http://localhost:5000',
        ws: true,
        changeOrigin: true,
        secure: false,
      }
    }
  },
});