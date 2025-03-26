import { defineConfig, globalIgnores } from 'eslint/config';
import { includeIgnoreFile } from '@eslint/compat';
import globals from 'globals';
import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import pluginReact from 'eslint-plugin-react';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const gitignorePath = path.resolve(__dirname, '.gitignore');


export default defineConfig([
  includeIgnoreFile(gitignorePath),
  globalIgnores(['*.js', '*.mjs', '**/*.d.ts', 'node_modules/*']),
  {
    files: ['src/**/*.{ts,tsx}'],
    languageOptions: { globals: globals.browser },
    plugins: { js },
    extends: [tseslint.configs.recommended,
      pluginReact.configs.flat.recommended,
      'js/recommended'],
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-unused-vars': 'off',
      '@typescript-eslint/ban-ts-comment': 'off',
      'react/react-in-jsx-scope': 'off',
      'react/jsx-key': 'off',
      'no-undef': 'off',
      'no-case-declarations': 'off',
      'react/no-unknown-property': ['error', { ignore: ['class', 'innerHTML', 'xmlns:xlink', 'enable-background', 'xml:space'] }],
      'no-unused-vars': ['error', {  argsIgnorePattern: "^_", varsIgnorePattern: 'h' }]
    },
  },

  // stencil.configs.flat.recommended,

]);