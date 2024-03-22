/* --------------------------------------------------------------------------------------------
 * Copyright (c) 2024 TypeFox and others.
 * Licensed under the MIT License. See LICENSE in the package root for license information.
 * ------------------------------------------------------------------------------------------ */

const locale = new URLSearchParams(window.location.search).get('locale');
const localeLoader: Partial<Record<string, () => Promise<void>>> = {
    de: async () => {
        await import('@codingame/monaco-vscode-language-pack-de');
    },
    es: async () => {
        await import('@codingame/monaco-vscode-language-pack-es');
    },
    fr: async () => {
        await import('@codingame/monaco-vscode-language-pack-fr');
    }
};

if (locale !== null) {
    const loader = localeLoader[locale];
    if (loader) {
        await loader();
    } else {
        console.error(`Unknown locale ${locale}`);
    }
}
