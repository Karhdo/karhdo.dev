import { defineConfig, globalIgnores } from 'eslint/config';
import js from '@eslint/js';

import nextCoreWebVitals from 'eslint-config-next/core-web-vitals';
import nextTypescript from 'eslint-config-next/typescript';

import prettierPlugin from 'eslint-plugin-prettier';

export default defineConfig([
  // 1. JS recommended
  js.configs.recommended,

  // 2. Next.js + Core Web Vitals + TypeScript (flat config của eslint-config-next@16)
  ...nextCoreWebVitals,
  ...nextTypescript,

  // 3. Custom rule
  {
    plugins: {
      prettier: prettierPlugin,
    },

    rules: {
      // Prettier
      'prettier/prettier': 'error',

      // React / Next
      'react/react-in-jsx-scope': 'off',
      'react/prop-types': 'off',
      'react/no-unescaped-entities': 'off',

      // A11y
      'jsx-a11y/anchor-is-valid': [
        'error',
        {
          components: ['Link'],
          specialLink: ['hrefLeft', 'hrefRight'],
          aspects: ['invalidHref', 'preferButton'],
        },
      ],

      // TypeScript
      '@typescript-eslint/no-unused-vars': 'off',
      '@typescript-eslint/explicit-module-boundary-types': 'off',
      '@typescript-eslint/no-var-requires': 'off',
      '@typescript-eslint/ban-ts-comment': 'off',
    },
  },

  // 4. Ignore files
  globalIgnores(['.next/**', 'out/**', 'build/**', 'next-env.d.ts', 'tailwind.config.js', './.contentlayer/**']),
]);
