/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        bg: '#080C14', surface: '#0D1420', surface2: '#121B2E', surface3: '#1A2540',
        accent: '#00C8FF', accent2: '#FF6B35', accent3: '#22D98A',
        warn: '#FFB800', danger: '#FF4444',
      },
      fontFamily: {
        mono: ['"Space Mono"', 'monospace'],
        display: ['Syne', 'sans-serif'],
        body: ['"DM Sans"', 'sans-serif'],
      }
    }
  },
  plugins: []
}
