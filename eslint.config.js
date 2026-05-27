import eslint from '@eslint/js'
import { defineConfig, globalIgnores } from 'eslint/config'
import prettierConfig from 'eslint-config-prettier'
import importPlugin from 'eslint-plugin-import'
import reactPlugin from 'eslint-plugin-react'
import reactHooks from 'eslint-plugin-react-hooks'
import globals from 'globals'
import tseslint from 'typescript-eslint'

const tsconfigRootDir = import.meta.dirname
const tsProjects = [
  './tsconfig.main.json',
  './tsconfig.preload.json',
  './tsconfig.renderer.json',
]

function createImportResolver(projects = tsProjects) {
  return {
    node: {
      extensions: ['.js', '.ts', '.tsx', '.d.ts'],
    },
    typescript: {
      alwaysTryTypes: true,
      noWarnOnMultipleProjects: true,
      project: projects,
    },
  }
}

function createProjectConfig(files, project, scopedGlobals) {
  return {
    files,
    languageOptions: {
      globals: scopedGlobals,
      parserOptions: {
        project: [project],
        tsconfigRootDir,
      },
    },
    settings: {
      'import/resolver': {
        ...createImportResolver([project]),
      },
    },
  }
}

export default defineConfig(
  globalIgnores([
    '.vite/**',
    'node_modules/**',
    'out/**',
    '*.tsbuildinfo',
    'eslint.config.js',
  ]),
  eslint.configs.recommended,
  tseslint.configs.recommendedTypeChecked,
  importPlugin.flatConfigs.recommended,
  importPlugin.flatConfigs.electron,
  reactPlugin.configs.flat.recommended,
  reactPlugin.configs.flat['jsx-runtime'],
  reactHooks.configs.flat['recommended-latest'],
  {
    files: ['**/*.{ts,tsx}'],
    extends: [importPlugin.flatConfigs.typescript],
    languageOptions: {
      parserOptions: {
        ecmaFeatures: {
          jsx: true,
        },
      },
    },
    settings: {
      react: {
        version: 'detect',
      },
      'import/resolver': createImportResolver(),
    },
    rules: {
      'import/order': [
        'error',
        {
          groups: [
            'builtin',
            'external',
            'internal',
            ['sibling', 'parent'],
            'index',
          ],
          'newlines-between': 'never',
          distinctGroup: false,
          alphabetize: {
            order: 'asc',
            caseInsensitive: true,
          },
        },
      ],
      'import/newline-after-import': 'error',
      'import/no-duplicates': 'error',
      'import/no-unresolved': ['error', { ignore: ['\\.css$'] }],
      'import/first': 'error',
      'react/react-in-jsx-scope': 'off',
      'react/prop-types': 'off',
    },
  },
  {
    files: ['*.config.js', '*.config.ts', 'forge.env.d.ts'],
    languageOptions: {
      globals: {
        ...globals.node,
      },
    },
    extends: [tseslint.configs.disableTypeChecked],
  },
  createProjectConfig(['src/main/**/*.ts'], './tsconfig.main.json', {
    ...globals.node,
  }),
  createProjectConfig(['src/preload/**/*.ts'], './tsconfig.preload.json', {
    ...globals.node,
  }),
  createProjectConfig(
    ['src/renderer/**/*.{ts,tsx}'],
    './tsconfig.renderer.json',
    {
      ...globals.browser,
    },
  ),
  createProjectConfig(['src/shared/**/*.ts'], './tsconfig.renderer.json', {}),
  prettierConfig,
)
