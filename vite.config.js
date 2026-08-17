import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';
import path from 'path';

export default defineConfig({
  logLevel: 'info',  // enable debug logging for Vite
  plugins: [react()],
  resolve: {
    alias: [
      // Map "@/..." to "./src/..."
      { find: '@', replacement: path.resolve(__dirname, 'src') }
    ]
  },
  server: {
    host: '127.0.0.1',   // bind Vite to the explicit IP Audiotool expects
    port: 5173,          // keep the same port you registered
    strictPort: true     // fail if the port is already in use
  }
});
