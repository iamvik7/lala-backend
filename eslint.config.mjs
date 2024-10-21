export default {
  files: ['**/*.js'],
  languageOptions: {
    ecmaVersion: 2020,
    sourceType: 'module',
  },
  plugins: {
    prettier: (await import('eslint-plugin-prettier')).default,
  },
  rules: {
    'prettier/prettier': 'error',
    'no-unused-vars': 'warn',
    'no-console': 'warn',
  },
};