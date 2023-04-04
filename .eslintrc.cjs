const path = require('path');
const headerDef = path.resolve(__dirname, './config/header.js');

module.exports = {
    env: {
        node: true,
        browser: true,
        es2022: true
    },
    extends: 'standard',
    globals: {
    },
    parser: '@typescript-eslint/parser',
    parserOptions: {
        ecmaVersion: '2022',
        sourceType: 'module',
        project: './tsconfig.json'
    },
    plugins: [
        '@typescript-eslint',
        'import',
        'unused-imports',
        'header'
    ],
    rules: {
        indent: ['error', 4, {
            SwitchCase: 1
        }],
        semi: ['error', 'always'],
        'no-extra-semi': 'off',
        '@typescript-eslint/no-extra-semi': ['error'],
        'no-dupe-class-members': 'off',
        '@typescript-eslint/no-dupe-class-members': ['error'],
        'no-redeclare': 'off',
        '@typescript-eslint/no-redeclare': ['error'],
        'no-useless-constructor': 'warn',
        'no-void': 'warn',
        // Following recommendation:
        // https://typescript-eslint.io/docs/linting/troubleshooting/#i-get-errors-from-the-no-undef-rule-about-global-variables-not-being-defined-even-though-there-are-no-typescript-errors
        'no-undef': 'off',
        'no-unused-vars': 'off',
        '@typescript-eslint/no-unused-vars': ['warn', {
            argsIgnorePattern: '^_'
        }],
        'header/header': [2, headerDef],
        'dot-notation': 'off',
        '@typescript-eslint/dot-notation': ['error'],
        'space-before-function-paren': ['error', {
            'anonymous': 'never',
            'named': 'never',
            'asyncArrow': 'always'
        }]
    },
    ignorePatterns: [
        '**/{node_modules,dist,lib,out,bin}',
        '.eslintrc.cjs',
        'config/header.js',
        'packages/examples/*/*.ts'
    ]
};
