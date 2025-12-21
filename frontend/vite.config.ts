import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      },
    },
  },
  
  // Production build optimizations
  build: {
    // Target modern browsers for smaller bundle
    target: 'es2020',
    
    // Enable minification
    minify: 'terser',
    
    // Enable source maps for debugging (optional, remove for smaller build)
    sourcemap: false,
    
    // Code splitting for better caching
    rollupOptions: {
      output: {
        manualChunks: {
          // Vendor chunks for better caching
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          'ui-vendor': ['lucide-react', 'recharts', 'framer-motion'],
        },
      },
    },
    
    // Chunk size warnings
    chunkSizeWarningLimit: 500,
    
    // Asset optimization
    assetsInlineLimit: 4096, // Inline assets smaller than 4kb
  },
  
  // Optimize dependencies
  optimizeDeps: {
    include: ['react', 'react-dom', 'react-router-dom'],
  },
})

