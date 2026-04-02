import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  // We removed 'root' because Vite defaults to the folder this file is in.
  plugins: [react(), tailwindcss()],
  
  optimizeDeps: {
    include: [
      'react', 'react-dom', 'react-router-dom', 
      'socket.io-client', 'axios', 'react-icons', 
      'react/jsx-runtime', 'react/jsx-dev-runtime'
    ]
  },

  esbuild: {
    target: 'es2020'
  },

  build: {
    // This will create a 'dist' folder right inside your 'client' folder
    outDir: 'dist', 
    emptyOutDir: true,
  },

  server: {
    host: true,
    port: 5173,
    strictPort: true,
    // Note: This proxy only matters for 'npm run dev' on your laptop. 
    // Your Nginx config handles the proxying in the Docker image.
    proxy: {
      '/api': { target: 'http://127.0.0.1:5000', changeOrigin: true, secure: false },
      '/video_feed': { target: 'http://127.0.0.1:5000', changeOrigin: true, secure: false },
      '/socket.io': { target: 'http://127.0.0.1:5000', ws: true, changeOrigin: true, secure: false }
    }
  }
});