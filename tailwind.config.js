/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        dark: {
          bg: '#0B0F14',
          surface: '#121821',
          elevated: '#18202B',
          border: '#243041',
          primary: '#E6EDF3',
          secondary: '#8B98A9',
        },
        brand: {
          teal: '#14B8A6',
          'teal-dark': '#0D9488',
        },
        severity: {
          safe: '#22C55E',
          warning: '#F59E0B',
          high: '#F97316',
          critical: '#EF4444',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      }
    },
  },
  plugins: [],
};
