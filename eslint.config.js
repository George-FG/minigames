import js from '@eslint/js'
import globals from 'globals'
import react from 'eslint-plugin-react'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import prettierPlugin from 'eslint-plugin-prettier'
import prettierConfig from 'eslint-config-prettier'
import tseslint from 'typescript-eslint'

export default tseslint.config(
  { ignores: ['dist', 'node_modules'] },
  
  js.configs.recommended,
  ...tseslint.configs.recommended,
  react.configs.flat.recommended,
  reactHooks.configs.flat.recommended,
  reactRefresh.configs.vite,
  prettierConfig,

  {
    files: ['**/*.{js,jsx,ts,tsx}'],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
    },
    settings: {
      react: { version: 'detect' },
    },
    plugins: {
      prettier: prettierPlugin,
    },
    rules: {
      // Make prettier run via eslint (so eslint --fix fixes whitespace)
      'prettier/prettier': 'error',

      // Common TS/React tweaks
      'react/react-in-jsx-scope': 'off', // React 17+
      'react/prop-types': 'off', // using TS
    },
  }
)
