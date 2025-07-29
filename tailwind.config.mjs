import typography from '@tailwindcss/typography'

/** @type {import('tailwindcss').Config} */
const config = {
  darkMode: 'class',
  content: [
    './src/**/*.{js,ts,jsx,tsx}',
    './components/**/*.{js,ts,jsx,tsx}',
    './app/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      typography: ({ theme }) => ({
        DEFAULT: {
          css: {
            color: theme('colors.slate.800'),
            a: {
              color: theme('colors.blue.600'),
              '&:hover': {
                color: theme('colors.blue.800'),
                textDecoration: 'underline',
              },
            },
            h1: { fontWeight: '700' },
            h2: { fontWeight: '700' },
            h3: { fontWeight: '700' },
            code: {
              backgroundColor: theme('colors.slate.100'),
              color: theme('colors.pink.600'),
              padding: '0.2em 0.4em',
              borderRadius: '0.25rem',
            },
            pre: {
              backgroundColor: theme('colors.slate.900'),
              color: theme('colors.slate.100'),
              borderRadius: '0.5rem',
              padding: '1em',
            },
            blockquote: {
              borderLeftColor: theme('colors.slate.300'),
              color: theme('colors.slate.600'),
              fontStyle: 'italic',
            },
            th: { color: theme('colors.slate.900') },
            td: { color: theme('colors.slate.700') },
          },
        },
        invert: {
          css: {
            color: theme('colors.slate.100'),
            a: {
              color: theme('colors.blue.400'),
              '&:hover': {
                color: theme('colors.blue.300'),
              },
            },
            code: {
              backgroundColor: theme('colors.slate.800'),
              color: theme('colors.pink.300'),
            },
            pre: {
              backgroundColor: theme('colors.slate.800'),
              color: theme('colors.slate.100'),
            },
            blockquote: {
              borderLeftColor: theme('colors.slate.600'),
              color: theme('colors.slate.300'),
            },
            th: { color: theme('colors.slate.100') },
            td: { color: theme('colors.slate.300') },
          },
        },
      }),
    },
  },
  plugins: [typography],
}

export default config
