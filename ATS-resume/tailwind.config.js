/** @type {import('tailwindcss').Config} */
// Colors read CSS variables (see src/index.css) so the same classes render the
// dark navy app on screen and a clean white report when printed.
const token = (name) => `rgb(var(--${name}) / <alpha-value>)`;

export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        navy: token('c-bg'),
        panel: token('c-panel'),
        surface: token('c-surface'),
        line: token('c-line'),
        ink: token('c-fg'),
        muted: token('c-muted'),
        accent: token('c-accent'),
        glow: token('c-glow'),
        blue: token('c-blue'),
        ok: token('c-ok'),
        warn: token('c-warn'),
        bad: token('c-bad'),
      },
      fontFamily: {
        display: ['Sora', 'Inter', 'system-ui', 'sans-serif'],
        sans: ['Inter', 'system-ui', '-apple-system', 'Segoe UI', 'sans-serif'],
      },
      boxShadow: {
        soft: '0 1px 0 rgb(255 255 255 / 0.04) inset, 0 24px 48px -28px rgb(0 0 0 / 0.75)',
        glow: '0 12px 32px -12px rgb(109 74 255 / 0.75)',
      },
    },
  },
  plugins: [],
};
