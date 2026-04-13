/**
 * ESLint flat config for ITSquare.AI
 * Lightweight — catches real bugs without framework-specific noise.
 */
import tseslint from 'typescript-eslint'

export default tseslint.config(
  {
    files: ['app/**/*.ts', 'app/**/*.tsx', 'lib/**/*.ts'],
    extends: [tseslint.configs.recommended],
    rules: {
      // Relax for our codebase
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
      '@typescript-eslint/no-require-imports': 'off',

      // Catch real bugs
      'no-debugger': 'error',
      'no-eval': 'error',
      'no-implied-eval': 'error',
      'prefer-const': 'warn',
      'no-var': 'error',
      eqeqeq: ['error', 'always', { null: 'ignore' }],
    },
  },
  {
    ignores: ['node_modules/', '.next/', 'packages/', '_v2/', '__tests__/'],
  },
)
