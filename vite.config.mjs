import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
// Use 'node:' protocol for built-in modules in ESM config
import os from 'node:os'; 
import path from 'node:path';

// Get the absolute path to the user's home directory (C:\Users\IrishC)
const homedir = os.homedir(); 

// Get the absolute path to the current working directory
const currentDir = process.cwd();

export default defineConfig({
  plugins: [react()],
  server: {
    // Explicitly set the file system allowance to trust the entire home directory 
    // and the current project directory. This is necessary due to the nested .git path.
    fs: {
      allow: [
        currentDir, // Trust the project root (agapai-web-app)
        homedir,    // Trust the root of your user profile (C:\Users\IrishC)
      ], 
    },
    // We will keep the host setting as a fallback
    host: true, 
    port: 5173, 
  },
});