/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./ai_service/app.py", // Scan for Tailwind classes in Python HTML string
  ],
  theme: {
    extend: {
      keyframes: {
        flashRed: {
          '0%, 100%': { borderColor: 'rgb(15 23 42)', boxShadow: 'inset 0 2px 4px 0 rgb(59 130 246 / 0.2)' },
          '50%': { borderColor: 'rgb(220 38 38)', boxShadow: 'inset 0 0 30px rgb(220 38 38 / 0.8)' },
        },
      },
      animation: {
        flashRed: 'flashRed 1.5s infinite',
      },
    },
  },
  plugins: [],
};
