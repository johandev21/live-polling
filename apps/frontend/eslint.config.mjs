import eslintPluginBetterTailwindcss from 'eslint-plugin-better-tailwindcss';
import typescriptParser from '@typescript-eslint/parser';

export default [
  {
    files: ['src/**/*.{ts,tsx}'],
    languageOptions: {
      parser: typescriptParser,
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
        ecmaFeatures: {
          jsx: true,
        },
      },
    },
    linterOptions: {
      // This config is intentionally limited to Tailwind rules.
      noInlineConfig: true,
      reportUnusedDisableDirectives: 'off',
    },
    settings: {
      'better-tailwindcss': {
        entryPoint: './src/index.css',
      },
    },
    plugins: {
      'better-tailwindcss': eslintPluginBetterTailwindcss,
    },
    rules: {
      'better-tailwindcss/enforce-consistent-class-order': 'warn',
      'better-tailwindcss/enforce-canonical-classes': [
        'warn',
        { collapse: false },
      ],
    },
  },
];
