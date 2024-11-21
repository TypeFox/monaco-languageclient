/* --------------------------------------------------------------------------------------------
 * Copyright (c) 2024 TypeFox and others.
 * Licensed under the MIT License. See LICENSE in the package root for license information.
 * ------------------------------------------------------------------------------------------ */

import { mergeConfig } from 'vite';
import { defineConfig as defineVitestConfig } from 'vitest/config';
import definedViteConfig from './vite.config.js';

export const vitestBaseConfig = {
    test: {
        testTimeout: 10000,
        pool: 'threads',
        poolOptions: {
            threads: {
                isolate: true
            }
        },
        browser: {
            enabled: true,
            headless: true,
            name: 'chrome',
            provider: 'webdriverio',
            api: {
                port: 20101,
            }
        },
        include: [
            '**/client/test/tools/index.test.ts',
            '**/wrapper/test/vscode/services.test.ts',
            '**/wrapper/test/editorApp.test.ts',
            '**/wrapper/test/languageClientWrapper.test.ts',
            '**/wrapper/test/utils.test.ts',
            '**/wrapper/test/wrapper.test.ts',
            '**/wrapper-react/test/index.test.tsx'
        ]
    }
};

const definedVitestConfig = defineVitestConfig(vitestBaseConfig);

export default mergeConfig(definedVitestConfig, definedViteConfig);

