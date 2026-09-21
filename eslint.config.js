import js from '@eslint/js';
import globals from 'globals';
import tseslint from 'typescript-eslint';
import reactHooks from 'eslint-plugin-react-hooks';

/**
 * Layer boundaries (see docs/ARCHITECTURE.md).
 *
 *   app -> features -> (content, storage, notifications, domain)
 *   content -> domain
 *   storage -> domain
 *   notifications -> domain
 *   domain -> nothing
 *
 * Enforced against the import path itself, so it holds however the import is
 * spelled.
 */
const forbid = (layers, message) => ({
  'no-restricted-imports': [
    'error',
    {
      patterns: layers.map((l) => ({
        group: [`**/${l}`, `**/${l}/**`],
        message,
      })),
    },
  ],
});

export default tseslint.config(
  { ignores: ['dist', 'dev-dist', 'coverage', 'node_modules'] },

  js.configs.recommended,
  ...tseslint.configs.recommended,

  {
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      ecmaVersion: 2022,
      globals: { ...globals.browser, ...globals.node },
    },
    plugins: { 'react-hooks': reactHooks },
    rules: {
      ...reactHooks.configs.recommended.rules,
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
      '@typescript-eslint/consistent-type-imports': [
        'error',
        { prefer: 'type-imports', fixStyle: 'inline-type-imports' },
      ],
    },
  },

  {
    files: ['src/domain/**/*.ts'],
    rules: forbid(
      ['storage', 'content', 'notifications', 'features', 'app'],
      'domain is the innermost layer and may not import from any other layer.',
    ),
  },
  {
    files: ['src/storage/**/*.ts'],
    rules: forbid(
      ['content', 'notifications', 'features', 'app'],
      'storage may only import from domain.',
    ),
  },
  {
    files: ['src/content/**/*.{ts,tsx}'],
    rules: forbid(
      ['storage', 'notifications', 'features', 'app'],
      'content may only import from domain.',
    ),
  },
  {
    files: ['src/notifications/**/*.ts'],
    rules: forbid(
      ['storage', 'content', 'features', 'app'],
      'notifications may only import from domain.',
    ),
  },
  {
    files: ['src/features/**/*.{ts,tsx}'],
    rules: forbid(['app'], 'features may not import from app.'),
  },

  {
    files: ['**/*.test.{ts,tsx}', 'src/test/**/*.ts'],
    rules: { 'no-restricted-imports': 'off' },
  },
);
