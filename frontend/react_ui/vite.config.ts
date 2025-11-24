import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';
import path from 'path';

export default defineConfig({
  base: './',   // IMPORTANT for Chrome extension paths

  plugins: [react()],

  resolve: {
    extensions: ['.js', '.jsx', '.ts', '.tsx', '.json'],
    alias: {
      // REMOVE any "figma:asset" aliases — use normal imports
      '@': path.resolve(__dirname, './src'),
    },
  },

  build: {
    target: 'esnext',

    // Build output MUST match Chrome extension expectations
    outDir: 'assets',
    emptyOutDir: true,

    rollupOptions: {
      input: path.resolve(__dirname, 'index.html'),
    },
  },

  server: {
    port: 3000,
    open: true,
  },
});
