/* --------------------------------------------------------------------------------------------
 * Copyright (c) 2024 TypeFox and others.
 * Licensed under the MIT License. See LICENSE in the package root for license information.
 * ------------------------------------------------------------------------------------------ */

import { playwright } from '@vitest/browser-playwright'
import { mergeConfig } from 'vite';
import { defineConfig as defineVitestConfig } from 'vitest/config';
import externalViteConfig from './vite.config.js';

/// <reference lib="vitest/config" />

export const vitestConfig = {
    test: {
        testTimeout: 30000,
        browser: {
            enabled: true,
            headless: true,
            provider: playwright(),
            api: {
                port: 20101
            },
            instances: [
                {
                    browser: 'chromium'
                }
            ]
        },
        coverage: {
            provider: 'v8',
            reporter: ['text', 'html'],
            include: [
                'packages/client',
                'packages/vscode-ws-jsonrpc',
                'packages/wrapper-react'
            ],
        },
        include: [
            // keep also an explicit list of tests to run, so they can be commented in case of problems
            // '**/client/test/common/logging.test.ts',
            // '**/client/test/common/utils.test.ts',
            // '**/client/test/fs/endpoints/emptyEndpoint.test.ts',
            // '**/client/test/vscode/manager.test.ts',
            // '**/client/test/vscode/manager.wrongHtmlContainer.test.ts',
            // '**/client/test/wrapper/lcmanager.test.ts',
            // '**/client/test/wrapper/lcwrapper.test.ts',
            // '**/client/test/worker/workerFactory.test.ts',
            // '**/client/test/worker/workerLoaders.test.ts',
            // '**/client/test/editorApp/editorApp.test.ts',
            // '**/client/test/editorApp/editorApp-classic.test.ts',
            // '**/client/test/editorApp/editorApp.noservices.test.ts',
            // '**/client/test/editorApp/editorApp.wrongservices.test',
            // '**/client/test/editorApp/config.test.ts',
            // '**/wrapper-react/test/index.test.tsx',
            '**/client/test/**/*',
            '**/wrapper-react/test/**/*'
        ],
        exclude: [
            '**/support/**/*',
            '**/__screenshots__/**/*',
        ]
    }
};

const definedVitestConfig = defineVitestConfig(vitestConfig);

export default mergeConfig(definedVitestConfig, externalViteConfig);

