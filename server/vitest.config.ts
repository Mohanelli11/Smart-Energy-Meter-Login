import { defineConfig } from 'vitest/config'

// Explicit config so Vitest never walks up and loads the web app's root vite.config.ts
// (which depends on packages the API doesn't install).
export default defineConfig({
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
  },
})
