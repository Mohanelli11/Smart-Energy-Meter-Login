/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  // Class-based dark mode. Change to 'media' to follow the system preference.
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: '#0ea5e9',
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
    },
  },
  // Keep classes that are generated dynamically at runtime
  safelist: ['bg-red-500', { pattern: /^text-(red|green|blue)-/ }],
  plugins: [],
}
