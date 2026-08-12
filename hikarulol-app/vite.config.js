import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

const e2bHost = process.env.E2B_HOST || 'true';

export default defineConfig({
  base: './',
  plugins: [react()],
  server: {
    port: 5173,
    host: '0.0.0.0',
    strictPort: true,
    cors: true,
    allowedHosts: e2bHost === 'true' ? true : [e2bHost],
    hmr: { host: 'localhost' },
  },
  preview: {
    port: 5173,
    host: '0.0.0.0',
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    target: 'chrome120',
  },
});
