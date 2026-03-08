import js from '@eslint/js';
import pluginNext from '@next/eslint-plugin-next';
import pluginTs from '@typescript-eslint/eslint-plugin';
import parserTs from '@typescript-eslint/parser';
import pluginImport from 'eslint-plugin-import';
import pluginReact from 'eslint-plugin-react';
import pluginReactHooks from 'eslint-plugin-react-hooks';
import storybook from 'eslint-plugin-storybook';
import globals from 'globals';

/** @type {import("eslint").Linter.Config[]} */
const eslintConfig = [
  // 1. 글로벌 무시 설정
  {
    ignores: ['.next/**', 'node_modules/**', 'dist/**', 'public/**', 'coverage/**'],
  },

  // 2. 기본 JS/TS 공통 설정
  {
    files: ['**/*.{js,jsx,ts,tsx}'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: {
        ...globals.browser,
        ...globals.node,
        ...globals.es2021,
      },
      parser: parserTs,
      parserOptions: {
        ecmaFeatures: { jsx: true },
      },
    },
    plugins: {
      '@typescript-eslint': pluginTs,
      react: pluginReact,
      'react-hooks': pluginReactHooks,
      '@next/next': pluginNext,
      import: pluginImport,
    },
    settings: {
      react: { version: 'detect' },
      'import/resolver': {
        typescript: true,
        node: true,
      },
    },
    rules: {
      ...js.configs.recommended.rules,
      ...pluginTs.configs.recommended.rules,
      ...pluginReactHooks.configs.recommended.rules,
      ...pluginNext.configs.recommended.rules,
      ...pluginNext.configs['core-web-vitals'].rules,

      // 사용자 정의 규칙 최적화
      'no-undef': 'off', // TypeScript에서 이미 처리함
      'react/react-in-jsx-scope': 'off', // Next.js 17+ 불필요
      'react/prop-types': 'off',
      '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
    },
  },

  // 3. 테스트 파일 전용 설정 (Jest/Vitest 전역 변수)
  {
    files: ['**/*.{test,spec}.{ts,tsx,js,jsx}', '**/tests/**'],
    languageOptions: {
      globals: {
        ...globals.jest,
        vi: 'readonly',
      },
    },
  },

  // 4. Storybook 설정
  ...storybook.configs['flat/recommended'],
];

export default eslintConfig;
