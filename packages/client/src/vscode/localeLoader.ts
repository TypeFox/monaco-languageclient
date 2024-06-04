/* --------------------------------------------------------------------------------------------
 * Copyright (c) 2024 TypeFox and others.
 * Licensed under the MIT License. See LICENSE in the package root for license information.
 * ------------------------------------------------------------------------------------------ */

const localeLoader: Partial<Record<string, () => Promise<void>>> = {
    cs: async () => {
        await import('@codingame/monaco-vscode-language-pack-cs');
    },
    de: async () => {
        await import('@codingame/monaco-vscode-language-pack-de');
    },
    es: async () => {
        await import('@codingame/monaco-vscode-language-pack-es');
    },
    fr: async () => {
        await import('@codingame/monaco-vscode-language-pack-fr');
    },
    it: async () => {
        await import('@codingame/monaco-vscode-language-pack-it');
    },
    ja: async () => {
        await import('@codingame/monaco-vscode-language-pack-ja');
    },
    ko: async () => {
        await import('@codingame/monaco-vscode-language-pack-ko');
    },
    pl: async () => {
        await import('@codingame/monaco-vscode-language-pack-pl');
    },
    'pt-br': async () => {
        await import('@codingame/monaco-vscode-language-pack-pt-br');
    },
    'qps-ploc': async () => {
        await import('@codingame/monaco-vscode-language-pack-qps-ploc');
    },
    ru: async () => {
        await import('@codingame/monaco-vscode-language-pack-ru');
    },
    tr: async () => {
        await import('@codingame/monaco-vscode-language-pack-tr');
    },
    'zh-hans': async () => {
        await import('@codingame/monaco-vscode-language-pack-zh-hans');
    },
    'zh-hant': async () => {
        await import('@codingame/monaco-vscode-language-pack-zh-hant');
    }
};

export const locales = Object.keys(localeLoader);

export const initLocaleLoader = async (locale = new URLSearchParams(window.location.search).get('locale')) => {
    if (locale !== null) {
        const loader = localeLoader[locale];
        if (loader) {
            await loader();
        } else {
            console.error(`Unknown locale ${locale}`);
        }
    }
};
