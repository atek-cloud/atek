module.exports = {
  purge: {
    content: [
      './static/**/*.html',
      './static/**/*.js'
    ],
    options: {
      safelist: [
      ]
    }
  },
  theme: {
    extend: {
      textColor: {
        default: 'var(--color-text-default)',
        'default-2': 'var(--color-text-default-2)',
        'default-3': 'var(--color-text-default-3)',
        'default-4': 'var(--color-text-default-4)',
        inverse: 'var(--color-text-inverse)',
        'inverse-2': 'var(--color-text-inverse-2)',
        'inverse-3': 'var(--color-text-inverse-3)',
        'inverse-4': 'var(--color-text-inverse-4)',
        primary: 'var(--color-text-primary)',
        'primary-2': 'var(--color-text-primary-2)',
        secondary: 'var(--color-text-secondary)',
        'secondary-2': 'var(--color-text-secondary-2)',
        error: 'var(--color-text-error)',
        'error-2': 'var(--color-text-error-2)',
        link: 'var(--color-text-link)',
      },
      backgroundColor: {
        default: 'var(--color-bg-default)',
        'default-2': 'var(--color-bg-default-2)',
        'default-3': 'var(--color-bg-default-3)',
        'default-4': 'var(--color-bg-default-4)',
        inverse: 'var(--color-bg-inverse)',
        'inverse-2': 'var(--color-bg-inverse-2)',
        'inverse-3': 'var(--color-bg-inverse-3)',
        'inverse-4': 'var(--color-bg-inverse-4)',
        primary: 'var(--color-bg-primary)',
        'primary-2': 'var(--color-bg-primary-2)',
        secondary: 'var(--color-bg-secondary)',
        'secondary-2': 'var(--color-bg-secondary-2)',
        error: 'var(--color-bg-error)',
        'error-2': 'var(--color-bg-error-2)',
      },
      borderColor: {
        default: 'var(--color-border-default)',
        'default-2': 'var(--color-border-default-2)',
        'default-3': 'var(--color-border-default-3)',
        'default-4': 'var(--color-border-default-4)',
        darker: 'var(--color-border-darker)',
        'darker-2': 'var(--color-border-darker-2)',
        'darker-3': 'var(--color-border-darker-3)',
        inverse: 'var(--color-border-inverse)',
        primary: 'var(--color-border-primary)',
        'primary-2': 'var(--color-border-primary-2)',
        secondary: 'var(--color-border-secondary)',
        'secondary-2': 'var(--color-border-secondary-2)',
        error: 'var(--color-border-error)',
        'error-2': 'var(--color-border-error-2)',
      },
      fontFamily: {
        body: 'var(--font-body)',
        heading: 'var(--font-heading)',
        code: 'var(--font-code)',
      },
      screens: {
        hov: {raw: '(hover: hover)'},
      }
    }
  },
  variants: {
    extend: {
      margin: ['last']
    }
  },
  plugins: [],
}