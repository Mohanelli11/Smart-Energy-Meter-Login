export default {
  plugins: {
    // Utility-first CSS framework for rapid UI development
    tailwindcss: {},
    // Add vendor prefixes for cross-browser compatibility
    autoprefixer: {
      // Support modern browsers: >1% market share, last 2 versions, exclude dead browsers and IE 11
      overrideBrowserslist: [
        '> 1%',
        'last 2 versions',
        'not dead',
        'not IE 11',
      ],
    },
    // CSS minification for production builds (reduces file size)
    ...(process.env.NODE_ENV === 'production' && {
      cssnano: {
        preset: [
          'default',
          {
            discardComments: {
              removeAll: true,
            },
            normalizeUnicode: false,
          },
        ],
      },
    }),
  },
}
