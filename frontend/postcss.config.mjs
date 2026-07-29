/**
 * Tailwind CSS v4 is wired through its PostCSS plugin. There is no
 * `tailwind.config.js` in v4 — design tokens live in `@theme` inside
 * `src/app/globals.css`.
 */
const config = {
  plugins: {
    '@tailwindcss/postcss': {},
  },
};

export default config;
