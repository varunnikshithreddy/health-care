/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#f0fdf4',
          100: '#dcfce7',
          200: '#bbf7d0',
          300: '#86efac',
          400: '#4ade80',
          500: '#22c55e',
          600: '#16a34a',
          700: '#15803d',
          800: '#166534',
          900: '#14532d',
          950: '#052e16',
        },
        sage: {
          50: '#f4f7f4',
          100: '#e5ece5',
          200: '#ceddce',
          300: '#acc4ac',
          400: '#83a583',
          500: '#648864',
          600: '#4e6d4e',
          700: '#3f563f',
          800: '#354635',
          900: '#2c392c',
        },
        sand: {
          50: '#faf8f5',
          100: '#f5f0e9',
          200: '#ece3d6',
          300: '#dfd0bd',
          400: '#cfb99e',
          500: '#bd9f80',
          600: '#ac8b6e',
          700: '#8f7259',
          800: '#755e4b',
          900: '#604e40',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
      boxShadow: {
        'soft': '0 2px 15px -3px rgba(0, 0, 0, 0.05), 0 4px 6px -2px rgba(0, 0, 0, 0.025)',
        'soft-lg': '0 10px 25px -3px rgba(0, 0, 0, 0.06), 0 4px 6px -2px rgba(0, 0, 0, 0.03)',
      },
      borderRadius: {
        '2xl': '1rem',
        '3xl': '1.5rem',
      }
    },
  },
  plugins: [],
}
