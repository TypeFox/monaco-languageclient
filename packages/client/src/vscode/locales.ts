/* --------------------------------------------------------------------------------------------
 * Copyright (c) 2024 TypeFox and others.
 * Licensed under the MIT License. See LICENSE in the package root for license information.
 * ------------------------------------------------------------------------------------------ */

import type { LocalizationOptions } from '@codingame/monaco-vscode-localization-service-override';
import type { ILogger } from '@codingame/monaco-vscode-log-service-override';

export const createDefaultLocaleConfiguration = (): LocalizationOptions => {
    return {
        async clearLocale() {
            const url = new URL(window.location.href);
            url.searchParams.delete('locale');
            window.history.pushState(null, '', url.toString());
        },
        async setLocale(id: string) {
            const url = new URL(window.location.href);
            url.searchParams.set('locale', id);
            window.history.pushState(null, '', url.toString());
        },
        availableLanguages: [{
            locale: 'en',
            languageName: 'English'
        }, {
            locale: 'cs',
            languageName: 'Czech'
        }, {
            locale: 'de',
            languageName: 'German'
        }, {
            locale: 'es',
            languageName: 'Spanish'
        }, {
            locale: 'fr',
            languageName: 'French'
        }, {
            locale: 'it',
            languageName: 'Italian'
        }, {
            locale: 'ja',
            languageName: 'Japanese'
        }, {
            locale: 'ko',
            languageName: 'Korean'
        }, {
            locale: 'pl',
            languageName: 'Polish'
        }, {
            locale: 'pt-br',
            languageName: 'Portuguese (Brazil)'
        }, {
            locale: 'qps-ploc',
            languageName: 'Pseudo Language'
        }, {
            locale: 'ru',
            languageName: 'Russian'
        }, {
            locale: 'tr',
            languageName: 'Turkish'
        }, {
            locale: 'zh-hans',
            languageName: 'Chinese (Simplified)'
        }, {
            locale: 'zh-hant',
            languageName: 'Chinese (Traditional)'
        }, {
            locale: 'en',
            languageName: 'English'
        }]
    };
};

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

export const initLocaleLoader = async (locale = new URLSearchParams(window.location.search).get('locale'), logger?: ILogger) => {
    if (locale !== null) {
        const loader = localeLoader[locale];
        if (loader) {
            await loader();
        } else {
            logger?.error(`Unknown locale ${locale}`);
        }
    }
};
