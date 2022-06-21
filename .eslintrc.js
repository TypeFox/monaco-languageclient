module.exports = {
    env: {
        browser: true,
        es2020: true
    },
    extends: 'standard',
    globals: {
        Thenable: 'readonly'
    },
    parser: '@typescript-eslint/parser',
    parserOptions: {
        ecmaVersion: '2020',
        sourceType: 'module'
    },
    plugins: [
        '@typescript-eslint',
        'import',
        'unused-imports'
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
        'no-void': 'warn'
    }
};
