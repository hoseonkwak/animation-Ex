import eslint from '@eslint/js'
import prettier from 'eslint-config-prettier'
import vue from 'eslint-plugin-vue'
import globals from 'globals'
import tseslint from 'typescript-eslint'

export default tseslint.config(
  {
    ignores: [
      'dist/**',
      'coverage/**',
      'playwright-report/**',
      'test-results/**',
      '.wrangler/**',
      'public/runtime/**',
      '*.config.js',
      '*.config.d.ts',
    ],
  },
  eslint.configs.recommended,
  ...tseslint.configs.recommended,
  ...vue.configs['flat/recommended'],
  {
    files: ['src/**/*.{ts,vue}'],
    languageOptions: {
      globals: globals.browser,
      parserOptions: {
        parser: tseslint.parser,
      },
    },
  },
  {
    files: ['ingestion/**/*.ts', 'tests/ingestion/**/*.ts'],
    languageOptions: {
      globals: globals.node,
    },
  },
  {
    files: ['server/**/*.ts'],
    languageOptions: {
      globals: globals.worker,
    },
  },
  {
    files: ['*.config.{js,ts}'],
    languageOptions: {
      globals: globals.node,
    },
  },
  {
    files: ['tests/e2e/**/*.mjs'],
    languageOptions: {
      globals: {
        ...globals.node,
        fetch: 'readonly',
      },
    },
  },
  {
    files: [
      'scripts/self-hosted-pilot.mjs',
      'scripts/raw-pilot.mjs',
      'scripts/prepare-internal-preview.mjs',
      'scripts/verify-internal-preview.mjs',
    ],
    languageOptions: {
      globals: { ...globals.node, ...globals.browser },
    },
  },
  prettier,
)
