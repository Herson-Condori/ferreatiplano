/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      // ✅ BREAKPOINTS PERSONALIZADOS PARA MÓVIL
      screens: {
        'xs': '475px',    // Phones pequeños (iPhone SE)
        'sm': '640px',    // Phones grandes (iPhone 12/13/14)
        'md': '768px',    // Tablets (iPad Mini)
        'lg': '1024px',   // Laptops
        'xl': '1280px',   // Desktop
        '2xl': '1536px',  // Desktop grande
      },
      
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
      },
      
      // ✅ ANIMACIONES PARA MÓVIL
      animation: {
        'fade-in': 'fadeIn 0.3s ease-in-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'slide-down': 'slideDown 0.3s ease-out',
      },
      
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        slideDown: {
          '0%': { transform: 'translateY(-20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
      },
    }
  },
  plugins: []
}