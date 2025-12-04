import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5174
  },
  preview: {
    port: 5174
  },
  // Use relative base so assets resolve under the current folder (e.g., /buildwise/)
  base: './',
  build: {
    outDir: '../backend/public/marketing',
    emptyOutDir: true
  }
});


