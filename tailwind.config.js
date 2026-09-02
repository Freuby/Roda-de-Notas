/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
              bg: '#F5F0E6',
              surface: '#FFFFFF',
              ink: '#1A3C2F',
              muted: '#7A7A7A',
              terracotta: {
                DEFAULT: '#FF6B00',
                soft: '#FFE3CC',
              },
              green: {
                DEFAULT: '#1A3C2F',
                light: '#2E6B52',
                soft: '#DCEFE6',
              },
              ochre: {
                DEFAULT: '#FFB300',
                soft: '#FFF3D6',
              },
              // Capoeira group colors
                      capoeiraBlue: {
                        DEFAULT: '#0467B0',
                        soft: '#D6E8F7',
                        dark: '#034A82',
                      },
                      capoeiraGreen: {
                        DEFAULT: '#03A501',
                        soft: '#D6F7E1',
                        dark: '#027A01',
                      },
                      capoeiraGold: {
                        DEFAULT: '#E8DF24',
                        soft: '#FFF9D6',
                        dark: '#B8A81A',
                      },
              border: '#E3DCC9',
            },
      fontFamily: {
        display: ['Poppins', 'sans-serif'],
        sans: ['Inter', 'sans-serif'],
      },
      borderRadius: {
        DEFAULT: '12px',
        card: '16px',
      },
      animation: {
        'spin-slow': 'spin 22s linear infinite',
      },
    },
  },
  plugins: [],
};