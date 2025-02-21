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
    minify: false,
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
  define: {
    'process.env.NODE_ENV': '"development"',
    'process.env.DEBUG': 'true'
  },
  server: {
    port: 3000,
    strictPort: true,
    hmr: {
      overlay: true,
      protocol: 'ws',
      host: 'localhost',
      timeout: 1000,
    },
    watch: {
      usePolling: true,
    },
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
  logLevel: 'info',
  clearScreen: false,
  mode: 'development',
  esbuild: {
    drop: [],
    keepNames: true
  }
});
// DO NOT DELETE END - Vite Configuration
