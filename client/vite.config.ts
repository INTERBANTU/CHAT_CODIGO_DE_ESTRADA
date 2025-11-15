import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5174, // Porta diferente para não conflitar com o outro projeto
    host: '0.0.0.0'
  }
});