import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Dev server proxy to backend API (port 4100)
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/inspection': 'http://localhost:3100',
      '/lookup': 'http://localhost:3100',
      '/oauth2': 'http://localhost:3100'
    }
  }
});
