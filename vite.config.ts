import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

// DO NOT DELETE START - Vite Configuration
export default defineConfig({
  plugins: [react()],
  base: process.env.ELECTRON === 'true' ? './' : '/',
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: true,
    rollupOptions: {
      input: {
        main: path.resolve(__dirname, 'index.html'),
      },
      output: {
        manualChunks: undefined
      }
    },
    emptyOutDir: true,
  },
  server: {
    port: 3000,
    strictPort: true,
    // Enhanced Hot Module Replacement settings
    hmr: {
      overlay: true,
      protocol: 'ws',
      host: 'localhost',
      timeout: 1000,
    },
    watch: {
      usePolling: true,
    },
    // Enable CORS for development
    cors: true,
  },
  optimizeDeps: {
    include: ['react', 'react-dom'],
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  // Enable more detailed build info
  logLevel: 'info',
  clearScreen: false,
});
// DO NOT DELETE END - Vite Configuration
