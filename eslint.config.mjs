import globals from 'globals';
import tsParser from '@typescript-eslint/parser';

import pluginTypescriptEslint from '@typescript-eslint/eslint-plugin';
import pluginImport from 'eslint-plugin-import';
import pluginUnusedImports from 'eslint-plugin-unused-imports';
import pluginHeader from 'eslint-plugin-header';
import pluginStylistic from '@stylistic/eslint-plugin';

// Workaround, see https://github.com/Stuk/eslint-plugin-header/issues/57#issuecomment-2378485611
pluginHeader.rules.header.meta.schema = false;

export default [{
    ignores: [
        '**/.chrome/**/*',
        '**/node_modules/**/*',
        '**/dist/**/*',
        '**/lib/**/*',
        '**/out/**/*',
        '**/bin/**/*',
        '**/resources/**/*',
        '**/production/**/*',
        '**/public/**/*',
        '**/.next/**/*',
        '**/*env.d.ts',
        '**/.pnp.*'
    ],
}, {
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
        // only contain rules unsupported by oxlint
        'constructor-super': 'error',
        'dot-notation': 'error',
        'getter-return': 'error',
        'new-parens': 'error',
        'no-dupe-args': 'error',
        'no-misleading-character-class': 'error',
        'no-multiple-empty-lines': ['error', {
            'max': 1
        }],
        'no-octal': 'error',
        'no-trailing-spaces': 'error',
        'no-undef': 'off',
        'no-unreachable': 'error',
        'prefer-const': 'error',
        'quotes': [2, 'single', {
            'avoidEscape': true
        }],
        'semi': [2, 'always'],
        'space-before-function-paren': ['error', {
            'anonymous': 'never',
            'asyncArrow': 'always',
            'named': 'never'
        }],
        // plugin rules
        'pluginHeader/header': [2, 'block', {
            pattern: 'MIT License|DO NOT EDIT MANUALLY!'
        }],
        '@stylistic/indent': 'error',
        '@stylistic/type-annotation-spacing': 'error',
        '@typescript-eslint/parameter-properties': 'error',
        '@typescript-eslint/no-unnecessary-condition': 'error'
    }
}];
