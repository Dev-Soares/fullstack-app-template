// @ts-check
import eslint from '@eslint/js';
import eslintPluginPrettierRecommended from 'eslint-plugin-prettier/recommended';
import globals from 'globals';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  {
    ignores: ['eslint.config.mjs', 'dist/**', 'node_modules/**'],
  },
  eslint.configs.recommended,
  ...tseslint.configs.recommendedTypeChecked,
  eslintPluginPrettierRecommended,
  {
    languageOptions: {
      globals: {
        ...globals.node,
        ...globals.jest,
      },
      sourceType: 'commonjs',
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
  },
  {
    rules: {
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/no-floating-promises': 'error',
      '@typescript-eslint/no-unsafe-argument': 'warn',
      'prettier/prettier': ['error', { endOfLine: 'auto' }],
    },
  },

  // Controllers must not import PrismaService — only services may.
  {
    files: ['src/modules/**/*.controller.ts'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['**/prisma.service', '**/database/prisma.service'],
              message:
                'Controllers must not import PrismaService. Use the feature service. Camadas: Controller → Service → PrismaService.',
            },
            {
              group: ['@prisma/client'],
              importNames: ['PrismaClient'],
              message:
                'Controllers must not instantiate PrismaClient. Use the feature service.',
            },
          ],
        },
      ],
    },
  },

  // Forbidden folders: services/ and controllers/ as subfolders inside modules
  {
    files: ['src/modules/**/services/**/*.ts', 'src/modules/**/controllers/**/*.ts'],
    rules: {
      'no-restricted-syntax': [
        'error',
        {
          selector: 'Program',
          message:
            'Forbidden folder. Server uses FLAT structure: <feature>.service.ts and <feature>.controller.ts at module root, never services/ or controllers/ subfolders.',
        },
      ],
    },
  },

  // Block error messages in English inside services (rough heuristic — requires manual review for false positives)
  // Detects throw new XxxException('...with mostly ASCII English words...')
  {
    files: ['src/modules/**/*.service.ts'],
    rules: {
      'no-restricted-syntax': [
        'warn',
        {
          selector:
            'NewExpression[callee.name=/Exception$/] > Literal[value=/^[A-Z][a-z]+ [a-z]+ [a-z ]+$/]',
          message:
            'Error messages must be in pt-BR. Example: "Usuário não encontrado", not "User not found".',
        },
      ],
    },
  },
);
