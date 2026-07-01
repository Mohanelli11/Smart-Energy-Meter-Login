import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// Merged and standardized Vite config (root)
export default defineConfig(({ command, mode }) => {
  const isProd = mode === 'production'

  return {
    plugins: [react()],

    // Serve and build from the site root
    base: '/',

    // Path aliases for cleaner imports
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },

    // Prefer import.meta.env.VITE_APP_VERSION at runtime. Do not inject a build-time global here.
    // Retrieve at runtime with: const version = import.meta.env.VITE_APP_VERSION ?? '0.0.0'

    // Build optimization
    build: {
      target: 'es2020', // adjusted target for modern-ish browser support; change if you need broader compatibility
      outDir: 'dist',
      sourcemap: false, // set to true for production debugging if needed

      // Use terser for production to allow advanced options (drop_console), esbuild otherwise for speed
      minify: isProd ? 'terser' : 'esbuild',

      // Terser options applied only when minify === 'terser'
      terserOptions: isProd
        ? {
            compress: {
              // Remove console.* calls in production only
              drop_console: true,
            },
          }
        : undefined,

      rollupOptions: {
        output: {
          // Manual chunking: separate react, recharts, lucide into their own chunks and group the rest into vendor
          manualChunks(id) {
            if (id.includes('node_modules')) {
              if (id.includes('react')) return 'react-vendor'
              if (id.includes('recharts')) return 'charts'
              if (id.includes('lucide-react')) return 'icons'
              return 'vendor'
            }
          },
        },
      },

      // CSS code splitting
      cssCodeSplit: true,

      // chunkSizeWarningLimit is in KB (not bytes). Increased to 2048 KB from the previous 500 KB.
      chunkSizeWarningLimit: 2048,
    },

    // esbuild options: when using esbuild minifier, drop console/debugger in production
    esbuild: isProd ? { drop: ['console', 'debugger'] } : {},

    // Development server configuration
    server: {
      port: 3000,
      strictPort: true, // fail if port is unavailable instead of trying another
      open: true, // automatically open in browser
      host: true, // allow network access
      cors: true,

      // Example proxy for API forwarding during development. Update target to your API server.
      proxy: {
        '/api': {
          target: 'http://localhost:5000',
          changeOrigin: true,
          rewrite: (p) => p.replace(/^\/api/, ''),
        },
      },
    },

    // Preview server (for testing production build)
    preview: {
      port: 4173,
      open: true,
    },

    // Dependency optimization: include core libs for faster dev start, exclude heavy runtime-only libs so they are chunked
    optimizeDeps: {
      include: ['react', 'react-dom'],
      exclude: ['recharts', 'lucide-react'],
    },
  }
})
