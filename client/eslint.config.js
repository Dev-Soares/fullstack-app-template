import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import tseslint from 'typescript-eslint'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      js.configs.recommended,
      tseslint.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
    },
    rules: {
      '@typescript-eslint/no-explicit-any': 'error',
    },
  },

  // Layer enforcement — components/pages cannot import axios or call services directly
  {
    files: [
      'src/pages/**/*.{ts,tsx}',
      'src/modules/**/components/**/*.{ts,tsx}',
      'src/shared/components/**/*.{ts,tsx}',
      'src/shared/layouts/**/*.{ts,tsx}',
    ],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          paths: [
            {
              name: 'axios',
              message:
                'Components/pages must not import axios directly. Use a hook from modules/<feature>/hooks/ that calls a service function.',
            },
          ],
          patterns: [
            {
              group: ['**/api/axios', '@/api/axios'],
              message:
                'Components/pages must not import the axios instance. Go through hook → service.',
            },
            {
              group: ['**/service/*', '**/services/*'],
              message:
                'Components/pages must not import service functions directly. Use a TanStack Query hook from modules/<feature>/hooks/.',
            },
          ],
        },
      ],
    },
  },

  // Hooks layer — cannot import axios; must go through service functions
  {
    files: ['src/modules/**/hooks/**/*.{ts,tsx}', 'src/shared/hooks/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          paths: [
            {
              name: 'axios',
              message: 'Hooks must call service functions, never axios directly.',
            },
          ],
          patterns: [
            {
              group: ['**/api/axios', '@/api/axios'],
              message: 'Hooks must call service functions, never the axios instance.',
            },
          ],
        },
      ],
    },
  },

  // shared/ cannot depend on modules/ (downward dependency only)
  {
    files: ['src/shared/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['**/modules/*', '@/modules/*'],
              message: 'shared/ must not import from modules/. Shared code is generic and module-agnostic.',
            },
            {
              group: ['**/pages/*', '@/pages/*'],
              message: 'shared/ must not import from pages/.',
            },
          ],
        },
      ],
    },
  },

  // modules/ cannot depend on pages/
  {
    files: ['src/modules/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['**/pages/*', '@/pages/*'],
              message: 'modules/ must not import from pages/. Pages compose modules, not vice-versa.',
            },
          ],
        },
      ],
    },
  },

  // Block inline styles + raw CSS imports — Tailwind v4 only
  {
    files: ['src/**/*.{ts,tsx}'],
    ignores: ['src/main.tsx', 'src/styles/**'],
    rules: {
      'no-restricted-syntax': [
        'error',
        {
          selector: 'JSXAttribute[name.name="style"]',
          message:
            'Inline style prop is forbidden. Use Tailwind utility classes (Tailwind v4 only).',
        },
        {
          selector: 'ImportDeclaration[source.value=/\\.(css|scss|sass|less)$/]',
          message: 'CSS/SCSS imports are forbidden outside src/styles/. Use Tailwind utility classes.',
        },
      ],
    },
  },
])
