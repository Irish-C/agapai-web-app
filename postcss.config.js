/**
 * PostCSS Configuration for Vite/React/Tailwind projects (ES Module format).
 * * This file MUST use ES module syntax (export default) because the project's
 * package.json sets "type": "module".
 */
export default {
  plugins: {
    // Tailwind CSS plugin must be included first
    'tailwindcss': {},
    // Autoprefixer is necessary to ensure CSS vendor prefixes are added
    'autoprefixer': {},
    // Any other PostCSS plugins would go here
  },
};