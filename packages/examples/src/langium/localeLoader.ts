/* --------------------------------------------------------------------------------------------
 * Copyright (c) 2024 TypeFox GmbH (http://www.typefox.io). All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 * ------------------------------------------------------------------------------------------ */

export const loadLocales = async () => {
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

    if (locale != null) {
        const loader = localeLoader[locale];
        if (loader != null) {
            await loader();
        } else {
            console.error(`Unknown locale ${locale}`);
        }
    }
};
