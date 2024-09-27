/* --------------------------------------------------------------------------------------------
 * Copyright (c) 2024 TypeFox and others.
 * Licensed under the MIT License. See LICENSE in the package root for license information.
 * ------------------------------------------------------------------------------------------ */

import { defineConfig, defineConfig as vitestDefineConfig, mergeConfig, UserConfig } from 'vitest/config';
import viteConfig from './vite.config.js';

export const vitestConfig: UserConfig = {
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
            '**/wrapper/test/editorAppBase.test.ts',
            '**/wrapper/test/editorAppClassic.test.ts',
            '**/wrapper/test/editorAppExtended.test.ts',
            '**/wrapper/test/languageClientWrapper.test.ts',
            '**/wrapper/test/utils.test.ts',
            '**/wrapper/test/wrapper.test.ts',
            '**/wrapper-react/test/index.test.tsx'
        ]
    }
};

export default defineConfig(configEnv => {

    console.log('vitestConfig:', vitestConfig);

    const mergedConfig = mergeConfig(
        viteConfig(configEnv),
        vitestDefineConfig(vitestConfig)
    );

    return mergedConfig;
});
