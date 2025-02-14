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
            provider: 'playwright',
            api: {
                port: 20101,
            },
            instances: [
                {
                    browser: 'chromium'
                }
            ]
        },
        // keep an explicit list of tests to run, so they can be commented in case of problems
        include: [
            '**/client/test/fs/endpoints/emptyEndpoint.test.ts',
            '**/client/test/tools/index.test.ts',
            '**/client/test/tools/utils.test.ts',
            '**/client/test/vscode/services.test.ts',
            '**/wrapper/test/vscode/services.test.ts',
            '**/wrapper/test/editorApp.test.ts',
            '**/wrapper/test/languageClientWrapper.test.ts',
            '**/wrapper/test/utils.test.ts',
            '**/wrapper/test/wrapper.test.ts',
            '**/wrapper-react/test/index.test.tsx',
            // '**/*.ts',
            // '**/*.tsx'
        ],
        dangerouslyIgnoreUnhandledErrors: true
    }
};

const definedVitestConfig = defineVitestConfig(vitestBaseConfig);

export default mergeConfig(definedVitestConfig, definedViteConfig);

