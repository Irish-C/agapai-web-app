import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const clientRoot = resolve(__dirname, '..');

export default defineConfig({
  root: clientRoot,
  plugins: [react(), tailwindcss()],
  optimizeDeps: {
    include: ['react', 'react-dom', 'react-router-dom', 'socket.io-client', 'axios', 'react-icons', 'react/jsx-runtime', 'react/jsx-dev-runtime']
  },
  esbuild: {
    target: 'es2020'
  },
  build: {
    outDir: resolve(clientRoot, '..', 'dist'),
    emptyOutDir: true,
  },
  server: {
    host: true,
    port: 5173,
    strictPort: true,
    proxy: {
      '/api': { target: 'http://127.0.0.1:5000', changeOrigin: true, secure: false },
      '/video_feed': { target: 'http://127.0.0.1:5000', changeOrigin: true, secure: false },
      '/socket.io': { target: 'http://127.0.0.1:5000', ws: true, changeOrigin: true, secure: false }
    }
  }
});