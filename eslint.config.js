/* eslint-env node */
/**
 * ESLint flat config compatible with ESLint v9+.
 * Mirrors the project's existing .eslintrc.yml rules.
 */
module.exports = [
  {
    languageOptions: { ecmaVersion: 2021, sourceType: 'script' },
    ignores: ['**/node_modules/**', 'test/sandbox/**', 'dist/**'],
    linterOptions: { reportUnusedDisableDirectives: true }
  },
  {
    files: ['**/*.js'],
    rules: {
      'linebreak-style': ['error', 'unix'],
      'quotes': ['error', 'single'],
      'semi': ['error', 'always']
    }
  },
  {
    files: ['test/**/*.js'],
    languageOptions: { ecmaVersion: 2021, globals: { describe: 'readonly', it: 'readonly', before: 'readonly', after: 'readonly', beforeEach: 'readonly', afterEach: 'readonly' } },
    rules: {}
  }
]
