/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        ps: {
          blue: '#003087',
          'blue-light': '#0070CC',
          'blue-dark': '#00105A',
          silver: '#B0B8C4',
          gold: '#FFB300',
        },
      },
    },
  },
  plugins: [],
}

