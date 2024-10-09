const defaultTheme = require('tailwindcss/defaultTheme')

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{astro,html,md,mdx,svelte,ts,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        secondary: '#CCDDE6',
        bg: '#1F2028',
      },
      animation: {
        'fade-in-up': 'fadeInUp 0.8s ease-in-out forwards',
      },
      keyframes: {
        fadeInUp: {
          '0%': {opacity: 0, transform: 'translateY(40px)'},
          '100%': {opacity: 1, transform: 'translateY(0)'},
        },
      },
    },
  },
  plugins: [require('@tailwindcss/typography'), require('@tailwindcss/aspect-ratio')],
}
