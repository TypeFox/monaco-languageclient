/* --------------------------------------------------------------------------------------------
 * Copyright (c) 2024 TypeFox and others.
 * Licensed under the MIT License. See LICENSE in the package root for license information.
 * ------------------------------------------------------------------------------------------ */

import { mergeConfig } from 'vite';
import { defineConfig as defineVitestConfig } from 'vitest/config';
import definedViteConfig from './vite.config.js';

/// <reference lib="vitest/config" />

export const vitestConfig = {
    test: {
        testTimeout: 30000,
        // fileParallelism: false,
        // threads: false,
        browser: {
            enabled: true,
            headless: true,
            provider: 'playwright',
            api: {
                port: 20101
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
            '**/wrapper/test/editorApp.test.ts',
            '**/wrapper/test/languageClientWrapper.test.ts',
            '**/wrapper/test/utils.test.ts',
            '**/wrapper/test/wrapper.test.ts',
            '**/wrapper/test/vscode/services.test.ts',
            '**/wrapper/test/editorApp-classic.test.ts',
            '**/wrapper/test/wrapper-classic.test.ts',
            '**/wrapper/test/workers/workerLoaders.test.ts',
            '**/wrapper-react/test/index.test.tsx'
        ]
    }
};

const definedVitestConfig = defineVitestConfig(vitestConfig);

export default mergeConfig(definedVitestConfig, definedViteConfig);

