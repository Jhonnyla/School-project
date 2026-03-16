/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        navy: {
          50: '#eef2f7',
          100: '#d9e2ec',
          200: '#b3c5d9',
          300: '#8da3c4',
          400: '#6781af',
          500: '#4a6394',
          600: '#3a5078',
          700: '#2a3d5c',
          800: '#1a2940',
          900: '#0f1729',
          950: '#080d18',
        },
        slate: {
          50: '#f8fafc',
          100: '#f1f5f9',
          200: '#e2e8f0',
          300: '#cbd5e1',
          400: '#94a3b8',
          500: '#64748b',
          600: '#475569',
          700: '#334155',
          800: '#1e293b',
          900: '#0f172a',
        },
        emerald: {
          active: '#059669',
          light: '#d1fae5',
        },
        amber: {
          expiring: '#d97706',
          light: '#fef3c7',
        },
      },
    },
  },
  plugins: [],
}
