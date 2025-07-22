/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        mono: ['Roboto Mono', 'monospace'],
        serif: ['Lora', 'serif'],
      },
      keyframes: {
        'fade-in': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        'fade-in-up': {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'scale-in': {
          '0%': { opacity: '0', transform: 'scale(0.95)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
         'progress': {
          '0%': { width: '0%' },
          '100%': { width: '100%' },
        },
        'typewriter': {
          from: { width: '0' },
          to: { width: '100%' }
        },
        'blink-caret': {
          'from, to': { borderColor: 'transparent' },
          '50%': { borderColor: 'currentColor' }
        },
        'glow': {
          '0%, 100%': { textShadow: '0 0 5px, 0 0 10px, 0 0 20px' },
          '50%': { textShadow: '0 0 10px, 0 0 20px, 0 0 40px' },
        },
        'flicker': {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.95' },
        }
      },
      animation: {
        'fade-in': 'fade-in 0.3s ease-out forwards',
        'fade-in-up': 'fade-in-up 0.4s ease-out forwards',
        'scale-in': 'scale-in 0.3s ease-out forwards',
        'progress': 'progress linear forwards',
        'typewriter': 'typewriter 2s steps(40, end)',
        'blink-caret': 'blink-caret .75s step-end infinite',
        'glow': 'glow 1.5s ease-in-out infinite alternate',
        'flicker': 'flicker 0.1s infinite',
      }
    }
  },
  plugins: [],
}
