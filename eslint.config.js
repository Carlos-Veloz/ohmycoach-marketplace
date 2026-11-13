import js from '@eslint/js';
import prettier from 'eslint-config-prettier';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import globals from 'globals';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  { ignores: ['dist', 'coverage', 'playwright-report', 'test-results', 'src/api/generated'] },
  {
    files: ['**/*.{ts,tsx}'],
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
    languageOptions: {
      ecmaVersion: 2022,
      globals: globals.browser,
    },
    plugins: {
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],
      // Tokens and personal data must never reach logs.
      'no-console': 'error',
      // D-068: numbers, money and dates use es-MX through src/lib/format.ts only.
      'no-restricted-syntax': [
        'error',
        {
          selector: "MemberExpression[object.name='Intl']",
          message: 'Use the formatters in src/lib/format.ts (es-MX, D-068).',
        },
        {
          selector:
            'CallExpression[callee.property.name=/^toLocale(String|DateString|TimeString)$/]',
          message: 'Use the formatters in src/lib/format.ts (es-MX, D-068).',
        },
      ],
    },
  },
  {
    files: ['src/lib/format.ts'],
    rules: { 'no-restricted-syntax': 'off' },
  },
  {
    files: ['scripts/**/*.mjs', '*.config.{js,ts}', 'e2e/**/*.ts'],
    languageOptions: { globals: globals.node },
    rules: { 'no-console': 'off' },
  },
  prettier,
);
