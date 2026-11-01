// PostCSS pipeline: Tailwind -> Autoprefixer (+ cssnano minification in production builds).
export default {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
    ...(process.env.NODE_ENV === 'production' ? { cssnano: { preset: ['default', { discardComments: { removeAll: true } }] } } : {}),
  },
}
