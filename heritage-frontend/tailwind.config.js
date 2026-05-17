/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#8B2500',
          light: '#B83200',
          pale: '#FDF0EC',
        },
        text: '#1A1614',
        'text-muted': '#6B6560',
        'stone-custom': {
          DEFAULT: '#6B6560',
          light: '#E8E4E1',
        },
        wood: '#7C5C3E',
        success: '#1E6B3C',
        warning: '#8A5A00',
        surface: '#FFFFFF',
        bg: '#F9F7F6',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        xl: '12px',
        '2xl': '16px',
      },
      boxShadow: {
        card: '0 1px 4px rgba(0,0,0,0.07), 0 0 0 1px rgba(0,0,0,0.04)',
      },
    },
  },
  plugins: [],
};
