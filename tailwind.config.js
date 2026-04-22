/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,jsx}'],
  safelist: [
    'grid-cols-2','grid-cols-3','grid-cols-4',
    'grid-cols-5','grid-cols-6','grid-cols-7','grid-cols-8',
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}
