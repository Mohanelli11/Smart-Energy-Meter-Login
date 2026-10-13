import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig(({ mode }) => {
  const isProd = mode === 'production'

  return {
    plugins: [react()],
    base: '/',

    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },

    build: {
      target: 'es2020',
      outDir: 'dist',
      sourcemap: false,
      // terser lets us strip console.* from production bundles
      minify: isProd ? 'terser' : 'esbuild',
      terserOptions: isProd ? { compress: { drop_console: true, drop_debugger: true } } : undefined,
      rollupOptions: {
        output: {
          manualChunks(id: string) {
            if (!id.includes('node_modules')) return undefined
            if (id.includes('/recharts/') || id.includes('/d3-')) return 'charts'
            if (id.includes('/lucide-react/')) return 'icons'
            if (id.includes('/leaflet/') || id.includes('/react-leaflet/')) return 'maps'
            // Everything else stays with Rollup's default splitting to avoid circular chunks
            return undefined
          },
        },
      },
      cssCodeSplit: true,
      chunkSizeWarningLimit: 1024,
    },

    server: {
      port: 3000,
      strictPort: true,
      host: true,
      // Same-origin API during development so httpOnly cookies work without CORS.
      proxy: {
        '/api': {
          target: process.env.VITE_DEV_API_TARGET || 'http://localhost:4000',
          changeOrigin: false,
        },
      },
    },

    preview: {
      port: 4173,
    },

    test: {
      globals: true,
      environment: 'jsdom',
      setupFiles: ['./src/test/setup.ts'],
      css: false,
      include: ['src/**/*.test.{ts,tsx}'],
    },
  }
})
