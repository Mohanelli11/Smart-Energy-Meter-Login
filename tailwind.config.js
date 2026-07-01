// Tailwind config — using ESM for consistency with package.json type: "module"
// - Adds dark mode, theme extensions, a safelist for dynamic classes, and useful plugins.

export default {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  // Use class-based dark mode. Change to 'media' to follow system preference.
  darkMode: 'class',
  theme: {
    extend: {
      // Project-specific tokens: replace with your design values as needed
      colors: {
        primary: '#0ea5e9',
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
    },
  },
  // Prevent purge from removing classes you generate dynamically at runtime
  safelist: [
    'bg-red-500',
    { pattern: /^text-(red|green|blue)-/ },
  ],
  plugins: [
    // Install these if you want improved form and prose styling:
    // npm install -D @tailwindcss/forms @tailwindcss/typography
    require('@tailwindcss/forms'),
    require('@tailwindcss/typography'),
  ],
}
