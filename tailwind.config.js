/* tailwind.js */
/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      keyframes: {
        shake: {
          '0%, 100%': { transform: 'translateX(0)' },
          '10%, 30%, 50%, 70%': { transform: 'translateX(-10px)' },
          '20%, 40%, 60%, 80%': { transform: 'translateX(10px)' },
        },
        toggleSlide: {
          '0%': { transform: 'translateX(0)' },
          '100%': { transform: 'translateX(100%)' },
        },
        ringPulse: {
          '0%': { boxShadow: '0 0 0 0 rgba(20, 184, 166, 0)' },
          '50%': { boxShadow: '0 0 0 8px rgba(20, 184, 166, 0.25)' },
          '100%': { boxShadow: '0 0 0 0 rgba(20, 184, 166, 0)' },
        },
      },
      animation: {
        shake: 'shake 0.5s cubic-bezier(.36,.07,.19,.97) both',
        toggleSlide: 'toggleSlide 0.3s cubic-bezier(0.4, 0, 0.2, 1) forwards',
        ringPulse: 'ringPulse 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
      },
      transitionTimingFunction: {
        smooth: 'cubic-bezier(0.4, 0, 0.2, 1)',
        'ease-in-out': 'cubic-bezier(0.4, 0.04, 0.6, 0.94)',
      },
    },
  },
  plugins: [],
};