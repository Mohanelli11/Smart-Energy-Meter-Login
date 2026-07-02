/**
 * PostCSS Configuration - Smart Energy Meter Login Page
 * 
 * This file configures the PostCSS plugins used in the build pipeline for CSS processing.
 * PostCSS is a tool that transforms CSS using JavaScript plugins.
 * 
 * ============================================================================
 * PLUGINS BREAKDOWN
 * ============================================================================
 * 
 * 1. TAILWINDCSS
 *    - Purpose: Utility-first CSS framework for rapid UI development
 *    - What it does: Scans your HTML/JSX files and generates only the CSS classes you use
 *    - Configuration: See tailwind.config.js for theme extensions and content paths
 *    - Benefit: Reduces CSS file size by eliminating unused styles
 * 
 * 2. AUTOPREFIXER
 *    - Purpose: Automatically adds vendor prefixes for cross-browser compatibility
 *    - Browser targets: >1% market share, last 2 versions, excludes dead/IE 11 browsers
 *    - What it does: Transforms modern CSS to work on older browsers (e.g., -webkit-, -moz-)
 *    - Why browsers need it: Different browsers use different prefixes for CSS features
 *    - Example: 'transform: rotate(45deg)' becomes '-webkit-transform: rotate(45deg)'
 *    - When to modify: Update overrideBrowserslist if you need to support older browsers
 * 
 * 3. CSSNANO (Production Only)
 *    - Purpose: CSS minification and optimization for production builds
 *    - When it runs: ONLY when NODE_ENV=production (automatically in `npm run build`)
 *    - What it does:
 *      • Removes all comments from CSS
 *      • Minifies CSS (removes whitespace, shortens property values)
 *      • Optimizes CSS rules for smaller file size
 *    - Impact: Reduces CSS bundle size by ~50-70% in production
 *    - Why optional: Development builds skip this for faster rebuild times
 * 
 * ============================================================================
 * ENVIRONMENT-SPECIFIC BEHAVIOR
 * ============================================================================
 * 
 * Development (npm run dev):
 *   - tailwindcss: ✓ Enabled - Generates all utilities
 *   - autoprefixer: ✓ Enabled - Adds vendor prefixes
 *   - cssnano: ✗ Disabled - Skipped for faster rebuild times
 * 
 * Production (npm run build):
 *   - tailwindcss: ✓ Enabled - Generates only used utilities (with purging)
 *   - autoprefixer: ✓ Enabled - Ensures compatibility
 *   - cssnano: ✓ Enabled - Minifies and optimizes CSS
 * 
 * ============================================================================
 * INSTALLATION & SETUP
 * ============================================================================
 * 
 * Required dependencies (should be in package.json):
 *   - tailwindcss: ^3.3.0+
 *   - autoprefixer: ^10.4.0+
 *   - postcss: ^8.4.0+
 * 
 * Optional (for production optimization):
 *   - cssnano: npm install --save-dev cssnano
 * 
 * Installation command:
 *   npm install --save-dev tailwindcss autoprefixer postcss cssnano
 * 
 * ============================================================================
 * COMMON TASKS & TROUBLESHOOTING
 * ============================================================================
 * 
 * Task: Test production CSS output locally
 *   Command: NODE_ENV=production npm run build
 *   Why: Verify cssnano minification works before deploying
 * 
 * Task: Support older browsers (e.g., IE 11)
 *   Change: Modify overrideBrowserslist in autoprefixer config
 *   Example: ['> 1%', 'last 3 versions', 'IE 11']
 *   ⚠️ Note: IE 11 support requires additional polyfills in your JavaScript
 * 
 * Task: Debug CSS not being generated
 *   Check: Ensure tailwind.config.js content paths include your HTML/JSX files
 *   Example: './src/**\/*.{js,jsx,ts,tsx}'
 * 
 * Task: CSS file too large
 *   Check 1: Run build with NODE_ENV=production to enable cssnano
 *   Check 2: Verify tailwind.config.js content paths don't include node_modules
 *   Check 3: Look for unused @apply directives in your CSS
 * 
 * ============================================================================
 * PERFORMANCE NOTES
 * ============================================================================
 * 
 * • Tailwind's "just-in-time" compiler (JIT mode) is active by default
 *   It dynamically generates CSS for classes found in your content files
 *   → Faster development builds, smaller final bundle size
 * 
 * • cssnano can be CPU-intensive on large CSS files
 *   Only runs in production mode to keep dev builds fast
 *   → Production CSS is ~50-70% smaller than development CSS
 * 
 * • Autoprefixer adds minimal overhead
 *   Typically <5ms for most projects
 *   → Critical for cross-browser compatibility
 * 
 * ============================================================================
 * RELATED FILES
 * ============================================================================
 * 
 * • tailwind.config.js     - Tailwind configuration (theme, plugins, content paths)
 * • vite.config.js         - Build tool configuration (may reference PostCSS)
 * • package.json           - Plugin versions and dependencies
 * • src/index.css          - Main CSS file imported in your app
 * 
 * ============================================================================
 * RESOURCES
 * ============================================================================
 * 
 * PostCSS Docs: https://postcss.org/
 * Tailwind Docs: https://tailwindcss.com/docs
 * Autoprefixer: https://github.com/postcss/autoprefixer
 * cssnano: https://cssnano.co/
 */

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
