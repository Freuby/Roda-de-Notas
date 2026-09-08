/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
              bg: 'var(--bg)',
              surface: 'var(--surface)',
              ink: 'var(--ink)',
              muted: 'var(--muted)',
              terracotta: {
                DEFAULT: 'var(--terracotta)',
                soft: 'var(--terracotta-soft)',
              },
              green: {
                DEFAULT: 'var(--green)',
                light: 'var(--green-light)',
                soft: 'var(--green-soft)',
              },
              ochre: {
                DEFAULT: 'var(--ochre)',
                soft: 'var(--ochre-soft)',
              },
              // Capoeira group colors
                      capoeiraBlue: {
                        DEFAULT: 'var(--capoeira-blue)',
                        soft: 'var(--capoeira-blue-soft)',
                        dark: 'var(--capoeira-blue-dark)',
                      },
                      capoeiraGreen: {
                        DEFAULT: 'var(--capoeira-green)',
                        soft: 'var(--capoeira-green-soft)',
                        dark: 'var(--capoeira-green-dark)',
                      },
                      capoeiraGold: {
                        DEFAULT: 'var(--capoeira-gold)',
                        soft: 'var(--capoeira-gold-soft)',
                        dark: 'var(--capoeira-gold-dark)',
                      },
              border: 'var(--border)',
            },
    },
  },
  plugins: [],
}