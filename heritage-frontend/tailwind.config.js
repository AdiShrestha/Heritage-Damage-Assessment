/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#A63A2A',
          light: '#C54F3A',
          dark: '#7A2A1A',
          pale: '#F7EDE8',
        },
        gold: {
          DEFAULT: '#D4A04A',
          light: '#E8C47A',
          pale: '#FDF6E8',
        },
        brick: {
          DEFAULT: '#C2714A',
          light: '#E8D5C4',
          pale: '#F5ECE4',
        },
        text: '#1C1816',
        'text-muted': '#7A726C',
        'stone-custom': {
          DEFAULT: '#7A726C',
          light: '#E2DCD6',
        },
        wood: '#8B6F4A',
        success: '#1E6B3C',
        warning: '#B8860B',
        surface: '#FFFFFF',
        bg: '#F5F0EB',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['"Playfair Display"', 'Georgia', 'serif'],
      },
      borderRadius: {
        xl: '12px',
        '2xl': '16px',
      },
      boxShadow: {
        card: '0 2px 8px rgba(28, 24, 22, 0.06), 0 0 0 1px rgba(28, 24, 22, 0.04)',
        elevated: '0 4px 16px rgba(28, 24, 22, 0.08), 0 0 0 1px rgba(28, 24, 22, 0.04)',
      },
      backgroundImage: {
        'brick-pattern': "url(\"data:image/svg+xml,%3Csvg width='60' height='30' viewBox='0 0 60 30' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M0 0h60v14H0z' fill='rgba(166,58,42,0.03)'/%3E%3Cpath d='M30 15h30v15H30z' fill='rgba(166,58,42,0.03)'/%3E%3Cpath d='M0 15h15v15H0z' fill='rgba(166,58,42,0.02)'/%3E%3C/svg%3E\")",
        'parchment': "url(\"data:image/svg+xml,%3Csvg width='200' height='200' viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.03'/%3E%3C/svg%3E\")",
      },
    },
  },
  plugins: [],
};
