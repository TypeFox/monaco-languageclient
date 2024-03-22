/* --------------------------------------------------------------------------------------------
 * Copyright (c) 2024 TypeFox and others.
 * Licensed under the MIT License. See LICENSE in the package root for license information.
 * ------------------------------------------------------------------------------------------ */

export const LangiumMonarchContent = {
    keywords: [
        'bigint',
        'boolean',
        'current',
        'Date',
        'entry',
        'extends',
        'false',
        'fragment',
        'grammar',
        'hidden',
        'import',
        'infer',
        'infers',
        'interface',
        'number',
        'returns',
        'string',
        'terminal',
        'true',
        'type',
        'with',
    ],
    operators: [
        '->',
        ',',
        ';',
        ':',
        '!',
        '?',
        '?=',
        '.',
        '..',
        '@',
        '*',
        '&',
        '+',
        '+=',
        '<',
        '=',
        '=>',
        '>',
        '|',
    ],
    symbols:
        /->|,|;|:|!|\?|\?=|\.|\.\.|\(|\)|\[|\[\]|\]|\{|\}|@|\*|&|\+|\+=|<|=|=>|>|\|/,

    tokenizer: {
        initial: [
            {
                regex: /\/(?![*+?])(?:[^\r\n[/\\]|\\.|\[(?:[^\r\n\]\\]|\\.)*\])+\//,
                action: { token: 'string' },
            },
            {
                regex: /\^?[_a-zA-Z][\w_]*/,
                action: {
                    cases: {
                        '@keywords': { token: 'keyword' },
                        '@default': { token: 'ID' },
                    },
                },
            },
            { regex: /"[^"]*"|'[^']*'/, action: { token: 'string' } },
            { include: '@whitespace' },
            {
                regex: /@symbols/,
                action: {
                    cases: {
                        '@operators': { token: 'operator' },
                        '@default': { token: '' },
                    },
                },
            },
        ],
        whitespace: [
            { regex: /\s+/, action: { token: 'white' } },
            { regex: /\/\*/, action: { token: 'comment', next: '@comment' } },
            { regex: /\/\/[^\n\r]*/, action: { token: 'comment' } },
        ],
        comment: [
            { regex: /[^/*]+/, action: { token: 'comment' } },
            { regex: /\*\//, action: { token: 'comment', next: '@pop' } },
            { regex: /[/*]/, action: { token: 'comment' } },
        ],
    },
};
