/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        dark: {
          bg: '#121212',
          card: '#1e1e1e',
          border: '#2e2e2e',
          text: '#e0e0e0',
          muted: '#a0a0a0',
          accent: '#3b82f6',
        },
      },
    },
  },
  plugins: [],
};
