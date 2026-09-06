/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      animation: {
        'blob-float': 'blobFloat 14s infinite ease-in-out alternate',
        'blob-reverse': 'blobReverse 18s infinite ease-in-out alternate',
        'pulse-slow': 'pulseGlow 6s infinite ease-in-out',
      },
      keyframes: {
        blobFloat: {
          '0%': { transform: 'translate(0px, 0px) scale(1)' },
          '50%': { transform: 'translate(40px, -60px) scale(1.12)' },
          '100%': { transform: 'translate(-30px, 30px) scale(0.92)' },
        },
        blobReverse: {
          '0%': { transform: 'translate(0px, 0px) scale(1)' },
          '50%': { transform: 'translate(-50px, 50px) scale(1.15)' },
          '100%': { transform: 'translate(30px, -40px) scale(0.9)' },
        },
        pulseGlow: {
          '0%, 100%': { opacity: '0.45' },
          '50%': { opacity: '0.8' },
        },
      },
    },
  },
  plugins: [],
}