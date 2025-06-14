/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        'inter': ['Inter', 'sans-serif'],
      },
      colors: {
        dark: {
          900: '#0a0a0a',
          800: '#1a1a1a',
          700: '#2d2d2d',
          600: '#404040',
          500: '#525252',
        },
        purple: {
          primary: '#8b5cf6',
          secondary: '#a78bfa',
        }
      },
      aspectRatio: {
        'reel': '9 / 16',
      },
    },
  },
  plugins: [],
};