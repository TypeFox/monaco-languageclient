const path = require('path');

module.exports = {
    root: true,
    parser: '@typescript-eslint/parser',
    env: {
        node: true,
        browser: true,
        es2022: true
    },
    extends: [
        'eslint:recommended',
        'plugin:@typescript-eslint/recommended'
    ],
    overrides: [
    ],
    parserOptions: {
        ecmaVersion: 2022,
        sourceType: 'module'
    },
    plugins: [
        '@typescript-eslint',
        'import',
        'unused-imports',
        'header'
    ],
    ignorePatterns: [
        '**/{node_modules,dist,lib,out,bin}',
        '.eslintrc.cjs'
    ],
    rules: {
        // List of [ESLint rules](https://eslint.org/docs/rules/)
        'arrow-parens': ['off', 'as-needed'],             // do not force arrow function parentheses
        'constructor-super': 'error',                     // checks the correct use of super() in sub-classes
        'dot-notation': 'error',                          // obj.a instead of obj['a'] when possible
        'eqeqeq': 'error',                                // ban '==', don't use 'smart' option!
        'guard-for-in': 'error',                          // needs obj.hasOwnProperty(key) checks
        'new-parens': 'error',                            // new Error() instead of new Error
        'no-bitwise': 'error',                            // bitwise operators &, | can be confused with &&, ||
        'no-caller': 'error',                             // ECMAScript deprecated arguments.caller and arguments.callee
        'no-cond-assign': 'error',                        // assignments if (a = '1') are error-prone
        'no-debugger': 'error',                           // disallow debugger; statements
        'no-eval': 'error',                               // eval is considered unsafe
        'no-inner-declarations': 'off',                   // we need to have 'namespace' functions when using TS 'export ='
        'no-labels': 'error',                             // GOTO is only used in BASIC ;)
        'no-multiple-empty-lines': ['error', { 'max': 1 }], // two or more empty lines need to be fused to one
        'no-new-wrappers': 'error',                       // there is no reason to wrap primitve values
        'no-throw-literal': 'error',                      // only throw Error but no objects {}
        'no-trailing-spaces': 'error',                    // trim end of lines
        'no-unsafe-finally': 'error',                     // safe try/catch/finally behavior
        'no-var': 'error',                                // use const and let instead of var
        'space-before-function-paren': ['error', {        // space in function decl: f() vs async () => {}
            'anonymous': 'never',
            'asyncArrow': 'always',
            'named': 'never'
        }],
        'semi': [2, 'always'],                            // Always use semicolons at end of statement
        'quotes': [2, 'single', { 'avoidEscape': true }], // Prefer single quotes
        'use-isnan': 'error',                             // isNaN(i) Number.isNaN(i) instead of i === NaN
        // Use MIT/Generated file header
        'header/header': [2, 'block', {
            'pattern': 'MIT License|DO NOT EDIT MANUALLY!'
        }],
        // List of [@typescript-eslint rules](https://github.com/typescript-eslint/typescript-eslint/tree/master/packages/eslint-plugin#supported-rules)
        '@typescript-eslint/adjacent-overload-signatures': 'error', // grouping same method names
        '@typescript-eslint/array-type': ['error', {                // string[] instead of Array<string>
            'default': 'array-simple'
        }],
        '@typescript-eslint/ban-types': 'error',                    // bans types like String in favor of string
        '@typescript-eslint/indent': 'error',                       // consistent indentation
        '@typescript-eslint/no-explicit-any': 'error',              // don't use :any type
        '@typescript-eslint/no-misused-new': 'error',               // no constructors for interfaces or new for classes
        '@typescript-eslint/no-namespace': 'off',                   // disallow the use of custom TypeScript modules and namespaces
        '@typescript-eslint/no-non-null-assertion': 'off',          // allow ! operator
        "@typescript-eslint/parameter-properties": "error",         // no property definitions in class constructors
        '@typescript-eslint/no-unused-vars': ['error', {            // disallow Unused Variables
            'argsIgnorePattern': '^_'
        }],
        '@typescript-eslint/no-var-requires': 'error',              // use import instead of require
        '@typescript-eslint/prefer-for-of': 'error',                // prefer for-of loop over arrays
        '@typescript-eslint/prefer-namespace-keyword': 'error',     // prefer namespace over module in TypeScript
        '@typescript-eslint/triple-slash-reference': 'error',       // ban /// <reference />, prefer imports
        '@typescript-eslint/type-annotation-spacing': 'error'       // consistent space around colon ':'
    }
};
