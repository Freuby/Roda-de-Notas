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
          soft<dyad-write path="tailwind.config.js" description="Tailwind configuration with Roda de Notas color palette">
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
    },
  },
  plugins: [],
}