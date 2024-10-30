import js from '@eslint/js';
import globals from 'globals';
import { FlatCompat } from '@eslint/eslintrc';
import tsParser from '@typescript-eslint/parser';

import pluginTypescriptEslint from '@typescript-eslint/eslint-plugin';
import pluginImport from 'eslint-plugin-import';
import pluginUnusedImports from 'eslint-plugin-unused-imports';
import pluginHeader from 'eslint-plugin-header';
import pluginStylistic from '@stylistic/eslint-plugin'

import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const compat = new FlatCompat({
    baseDirectory: __dirname,
    recommendedConfig: js.configs.recommended,
    allConfig: js.configs.all
});

// Workaround, see https://github.com/Stuk/eslint-plugin-header/issues/57#issuecomment-2378485611
pluginHeader.rules.header.meta.schema = false;

export default [{
    ignores: [
        '**/node_modules/**/*',
        '**/dist/**/*',
        '**/lib/**/*',
        '**/out/**/*',
        '**/bin/**/*',
        '**/resources/**/*',
        '**/production/**/*'
    ],
}, ...compat.extends('eslint:recommended', 'plugin:@typescript-eslint/recommended'), {
    files: [
        '**/src/**/*.ts',
        '**/src/**/*.tsx',
        '**/test/**/*.ts',
        '**/test/**/*.tsx'
    ],
    plugins: {
        '@typescript-eslint': pluginTypescriptEslint,
        import: pluginImport,
        'unused-imports': pluginUnusedImports,
        pluginHeader,
        '@stylistic': pluginStylistic
    },
    languageOptions: {
        globals: {
            ...globals.node,
            ...globals.browser
        },
        parser: tsParser,
        ecmaVersion: 2022,
        sourceType: 'module',
        parserOptions: {
            project: ['./tsconfig.json']
        }
    },
    rules: {
        'arrow-parens': ['off', 'as-needed'],
        'constructor-super': 'error',
        'dot-notation': 'error',
        eqeqeq: 'error',
        'guard-for-in': 'error',
        'new-parens': 'error',
        'no-bitwise': 'error',
        'no-caller': 'error',
        'no-cond-assign': 'error',
        'no-debugger': 'error',
        'no-eval': 'error',
        'no-inner-declarations': 'off',
        'no-labels': 'error',
        'no-multiple-empty-lines': ['error', {
            max: 1
        }],
        'no-new-wrappers': 'error',
        'no-throw-literal': 'error',
        'no-trailing-spaces': 'error',
        'no-unsafe-finally': 'error',
        'no-var': 'error',
        'space-before-function-paren': ['error', {
            anonymous: 'never',
            asyncArrow: 'always',
            named: 'never'
        }],
        semi: [2, 'always'],
        quotes: [2, 'single', {
            avoidEscape: true
        }],
        'use-isnan': 'error',
        'pluginHeader/header': [2, 'block', {
            pattern: 'MIT License|DO NOT EDIT MANUALLY!'
        }],
        '@typescript-eslint/adjacent-overload-signatures': 'error',
        '@typescript-eslint/array-type': ['error', {
            default: 'array-simple'
        }],
        '@typescript-eslint/no-empty-object-type': 'error',
        '@typescript-eslint/no-unsafe-function-type': 'error',
        '@typescript-eslint/no-wrapper-object-types': 'error',
        '@stylistic/indent': 'error',
        '@typescript-eslint/no-explicit-any': 'error',
        '@typescript-eslint/no-misused-new': 'error',
        '@typescript-eslint/no-namespace': 'off',
        '@typescript-eslint/no-non-null-assertion': 'off',
        '@typescript-eslint/parameter-properties': 'error',
        'no-unused-vars': 'off',
        '@typescript-eslint/no-unused-vars': ['error', {
            caughtErrorsIgnorePattern: '^_',
            argsIgnorePattern: '^_',
            varsIgnorePattern: '^_'
        }],
        '@typescript-eslint/no-var-requires': 'error',
        '@typescript-eslint/prefer-for-of': 'error',
        '@typescript-eslint/prefer-namespace-keyword': 'error',
        '@typescript-eslint/triple-slash-reference': 'error',
        '@stylistic/type-annotation-spacing': 'error',
        '@typescript-eslint/strict-boolean-expressions': 'error',
        '@typescript-eslint/no-unnecessary-condition': 'error'
    }
}];
