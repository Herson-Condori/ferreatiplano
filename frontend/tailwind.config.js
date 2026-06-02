/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        dark: { 
          bg: '#0F0E0C', 
          surface: '#1A1916', 
          border: '#2E2B24' 
        },
        light: { 
          text: '#F0EDE6' 
        },
        accent: { 
          DEFAULT: '#E8A020', 
          hover: '#D18F1A', 
          light: '#F5D08A' 
        }
      },
      fontFamily: {
        display: ['"Barlow Condensed"', 'sans-serif'],
        base: ['"Barlow"', 'sans-serif']
      }
    }
  },
  plugins: []
}