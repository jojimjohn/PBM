import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3001
  },
  css: {
    postcss: './postcss.config.js'
  },
  build: {
    // Enable source maps for debugging in production (optional)
    sourcemap: false,
    rollupOptions: {
      output: {
        // Manual chunk splitting for better caching
        manualChunks: {
          // React core - rarely changes, cache long-term
          'vendor-react': ['react', 'react-dom', 'react-router-dom'],
          // Charts library - only loaded when Reports/Inventory visited
          'vendor-charts': ['recharts'],
          // UI utilities - icons and animations
          'vendor-ui': ['lucide-react', 'framer-motion'],
        }
      }
    }
  }
})