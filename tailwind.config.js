/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './components/**/*.{js,vue,ts}',
    './layouts/**/*.vue',
    './pages/**/*.vue',
    './plugins/**/*.{js,ts}',
    './app.vue',
    './error.vue'
  ],
  darkMode: 'class',
  theme: {
    extend: {
      textColor: {
        blue: {
          800: '#1e40af'
        }
      }
    }
  },
  plugins: [
    function ({addBase, theme}) {
      addBase({
        '.dark .text-blue-800': {
          color: theme('colors.white')
        }
      })
    }
  ]
}