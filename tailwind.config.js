/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        'wits-blue': '#003DA5',
        'wits-blue-light': '#E6EEFF',
        'wits-blue-mid': '#B5C8F4',
        'wits-gold': '#C9A84C',
        'wits-gold-light': '#FBF4E3',
        'wits-gold-mid': '#F0D58A',
        sidebar: '#003DA5',
        surface: '#F0F3F8',
        'border-default': '#E2E0D8',
        success: '#3B6D11',
        'success-bg': '#EAF3DE',
        warning: '#7A5A00',
        'warning-bg': '#FBF4E3',
        danger: '#A32D2D',
        'danger-bg': '#FCEBEB',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
