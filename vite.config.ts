import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  
  // Path aliases for cleaner imports
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },

  // Environment variables configuration
  define: {
    'process.env.VITE_APP_VERSION': JSON.stringify(process.env.npm_package_version),
  },

  // Build optimization
  build: {
    outDir: 'dist',
    sourcemap: false, // Set to true for production debugging
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true, // Remove console logs in production
      },
    },
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom'],
          'charts': ['recharts'],
          'icons': ['lucide-react'],
        },
      },
    },
    // CSS code splitting
    cssCodeSplit: true,
    // Chunk size warning threshold (in bytes)
    chunkSizeWarningLimit: 500,
  },

  // Development server configuration
  server: {
    port: 3000,
    open: true, // Automatically open in browser
    host: true, // Allow network access
    cors: true,
  },

  // Preview server (for testing production build)
  preview: {
    port: 4173,
    open: true,
  },

  // Optimize dependencies
  optimizeDeps: {
    include: ['react', 'react-dom', 'recharts', 'lucide-react'],
  },
})
