import { defineConfig } from 'vitest/config'

// The API lives inside the web app's repo. Without explicit config, Vite/Vitest search parent
// folders and pick up the web app's root vite.config.ts and postcss.config.js, which need
// packages (vitest/config, tailwindcss) that the API does not install. Pin everything here.
export default defineConfig({
  // Inline PostCSS config stops Vite from searching upward for postcss.config.js
  css: { postcss: { plugins: [] } },
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
  },
})
