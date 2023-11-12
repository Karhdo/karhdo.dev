// @ts-check
const { fontFamily } = require('tailwindcss/defaultTheme');
const colors = require('tailwindcss/colors');

// ../node_modules/pliny/dist/**/*.mjs is needed for monorepo setup
/** @type {import("tailwindcss/types").Config } */
module.exports = {
  content: [
    '../node_modules/pliny/**/*.{js,ts,tsx}',
    './node_modules/pliny/**/*.{js,ts,tsx}',
    './app/**/*.{js,ts,jsx,tsx}',
    './pages/**/*.{js,ts,tsx}',
    './components/**/*.{js,ts,tsx}',
    './layouts/**/*.{js,ts,tsx}',
    './lib/**/*.{js,ts,tsx}',
    './data/**/*.mdx',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      keyframes: {
        'wave-animation': {
          '0%': { transform: 'rotate(0deg)' },
          '10%': { transform: 'rotate(14deg)' },
          '20%': { transform: 'rotate(-8deg)' },
          '30%': { transform: 'rotate(14deg)' },
          '40%': { transform: 'rotate(-4deg)' },
          '50%': { transform: 'rotate(10deg)' },
          '60%': { transform: 'rotate(0deg)' },
          '100%': { transform: 'rotate(0deg)' },
        },
        'music-bar-1': {
          '0%, 100%': { height: '0%' },
          '50%': { height: '70%' },
        },
        'music-bar-2': {
          '0%, 100%': { height: '50%' },
          '25%': { height: '0%' },
          '75%': { height: '100%' },
        },
        'music-bar-3': {
          '0%, 100%': { height: '70%' },
          '15%': { height: '100%' },
          '65%': { height: '0%' },
        },
        'music-bar-4': {
          '0%, 100%': { height: '50%' },
          '35.7%': { height: '0%' },
          '85.7%': { height: '70%' },
        },
      },
      animation: {
        wave: 'wave-animation 2.5s linear infinite',
        'music-bar-1': 'music-bar-1 .8s linear infinite',
        'music-bar-2': 'music-bar-2 .8s linear infinite',
        'music-bar-3': 'music-bar-3 .8s linear infinite',
        'music-bar-4': 'music-bar-4 .8s linear infinite',
      },
      boxShadow: {
        nextjs: '0 8px 20px rgb(0,0,0,0.12)',
        'nextjs-dark': '0 8px 20px rgb(255,255,255,0.12)',
      },
      spacing: {
        '9/16': '56.25%',
      },
      lineHeight: {
        11: '2.75rem',
        12: '3rem',
        13: '3.25rem',
        14: '3.5rem',
      },
      fontFamily: {
        sans: ['Outfit', ...fontFamily.sans],
      },
      colors: {
        primary: '#7aa2f7',
        sky: colors.sky,
        gray: colors.neutral,
        dark: '#1A1B26',
        spotify: '#1DB954',
        coral: '#EF596F',
      },
      typography: (theme) => ({
        DEFAULT: {
          css: {
            color: theme('colors.gray.700'),
            a: {
              color: theme('colors.primary'),
              '&:hover': {
                color: `${theme('colors.sky.600')} !important`,
              },
              code: { color: theme('colors.sky.400') },
            },
            h1: {
              fontWeight: '700',
              letterSpacing: theme('letterSpacing.tight'),
              color: theme('colors.gray.900'),
            },
            h2: {
              fontWeight: '700',
              letterSpacing: theme('letterSpacing.tight'),
              color: theme('colors.gray.900'),
            },
            h3: {
              fontWeight: '600',
              color: theme('colors.gray.900'),
            },
            'h4,h5,h6': {
              color: theme('colors.gray.900'),
            },
            pre: {
              backgroundColor: '#24283b',
            },
            code: {
              color: '#BB9AF7',
              backgroundColor: '#24283b',
              paddingLeft: '4px',
              paddingRight: '4px',
              paddingTop: '2px',
              paddingBottom: '2px',
              borderRadius: '0.25rem',
            },
            'code::before': {
              content: 'none',
            },
            'code::after': {
              content: 'none',
            },
            details: {
              backgroundColor: theme('colors.gray.100'),
              paddingLeft: '4px',
              paddingRight: '4px',
              paddingTop: '2px',
              paddingBottom: '2px',
              borderRadius: '0.25rem',
            },
            hr: { borderColor: theme('colors.gray.200') },
            'ol li::marker': {
              fontWeight: '600',
              color: theme('colors.gray.500'),
            },
            'ul li::marker': {
              backgroundColor: theme('colors.gray.500'),
            },
            strong: { color: theme('colors.gray.600') },
            blockquote: {
              color: theme('colors.gray.900'),
              borderLeftColor: theme('colors.gray.200'),
            },
          },
        },
        dark: {
          css: {
            color: theme('colors.gray.300'),
            a: {
              color: theme('colors.primary'),
              '&:hover': {
                color: `${theme('colors.sky.400')} !important`,
              },
              code: { color: theme('colors.sky.400') },
            },
            h1: {
              fontWeight: '700',
              letterSpacing: theme('letterSpacing.tight'),
              color: theme('colors.gray.100'),
            },
            h2: {
              fontWeight: '700',
              letterSpacing: theme('letterSpacing.tight'),
              color: theme('colors.gray.100'),
            },
            h3: {
              fontWeight: '600',
              color: theme('colors.gray.100'),
            },
            'h4,h5,h6': {
              color: theme('colors.gray.100'),
            },
            pre: {
              backgroundColor: '#24283b',
            },
            code: {
              backgroundColor: '#24283b',
            },
            details: {
              backgroundColor: theme('colors.gray.800'),
            },
            hr: { borderColor: theme('colors.gray.700') },
            'ol li::marker': {
              fontWeight: '600',
              color: theme('colors.gray.400'),
            },
            'ul li::marker': {
              backgroundColor: theme('colors.gray.400'),
            },
            strong: { color: theme('colors.gray.100') },
            thead: {
              th: {
                color: theme('colors.gray.100'),
              },
            },
            tbody: {
              tr: {
                borderBottomColor: theme('colors.gray.700'),
              },
            },
            blockquote: {
              color: theme('colors.gray.100'),
              borderLeftColor: theme('colors.gray.700'),
            },
          },
        },
      }),
    },
  },
  plugins: [require('@tailwindcss/forms'), require('@tailwindcss/typography')],
};
