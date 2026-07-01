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

    // Stable app version define. Prefer using import.meta.env.VITE_APP_VERSION at runtime.
    // APP_VERSION is injected at build time from package.json when available.
    define: {
      APP_VERSION: JSON.stringify(process.env.npm_package_version ?? process.env.VITE_APP_VERSION ?? '0.0.0'),
    },

    // Build optimization
    build: {
      target: 'es2019', // better backwards compatibility; consider 'esnext' if you only target modern browsers
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
          manualChunks: {
            'react-vendor': ['react', 'react-dom'],
            charts: ['recharts'],
            icons: ['lucide-react'],
          },
        },
      },

      // CSS code splitting
      cssCodeSplit: true,

      // chunkSizeWarningLimit is in KB (not bytes). Increased from 500 KB to 1024 KB.
      chunkSizeWarningLimit: 1024,
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

    // Dependency optimization: include core libs for faster dev start, exclude heavy runtime-only libs
    optimizeDeps: {
      include: ['react', 'react-dom'],
      exclude: ['recharts', 'lucide-react'],
    },
  }
})
