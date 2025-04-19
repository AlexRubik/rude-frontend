module.exports = {
  extends: 'next/core-web-vitals',
  rules: {
    // Convert errors to warnings or disable them
    'react/no-unescaped-entities': 'off',
    '@next/next/no-html-link-for-pages': 'off',
    '@next/next/no-img-element': 'warn',
    'react-hooks/exhaustive-deps': 'warn'
  }
} 