/* --------------------------------------------------------------------------------------------
 * Copyright (c) 2024 TypeFox and others.
 * Licensed under the MIT License. See LICENSE in the package root for license information.
 * ------------------------------------------------------------------------------------------ */

import { beforeAll, describe, expect, test } from 'vitest';
import { BrowserMessageReader, BrowserMessageWriter } from 'vscode-languageclient/browser.js';
import { delayExecution } from 'monaco-languageclient/common';
import { LanguageClientManager } from 'monaco-languageclient/lcwrapper';
import { MonacoVscodeApiWrapper, type MonacoVscodeApiConfig } from 'monaco-languageclient/vscodeApiWrapper';
import { createDefaultLcWorkerConfig, createMonacoEditorDiv } from '../support/helper.js';

describe('Test LanguageClientWrapper', () => {

    beforeAll(async () => {
        const apiConfig: MonacoVscodeApiConfig = {
            $type: 'extended',
            viewsConfig: {
                $type: 'EditorService',
                htmlContainer: createMonacoEditorDiv()
            }
        };
        const apiWrapper = new MonacoVscodeApiWrapper(apiConfig);
        await apiWrapper.start();
    });

    test('restart with languageclient', async () => {
        let error = false;
        const lcManager = new LanguageClientManager();

        const workerUrl = new URL('monaco-languageclient-examples/worker/langium', import.meta.url);
        const worker = new Worker(workerUrl, {
            type: 'module',
            name: 'Langium LS (Regular Test)'
        });
        expect(worker).toBeDefined();

        const reader = new BrowserMessageReader(worker);
        const writer = new BrowserMessageWriter(worker);
        const languageClientConfig = createDefaultLcWorkerConfig(worker, 'langium', { reader, writer });

        const lcConfigs = {
            configs: {
                'langium': languageClientConfig
            }
        };

        try {
            await expect(async () => await lcManager.setConfigs(lcConfigs)).not.toThrowError();
            await expect(async () => await lcManager.start()).not.toThrowError();
            await expect(async () => await lcManager.dispose()).not.toThrowError();

            await delayExecution(1000);

            await expect(async () => await lcManager.setConfigs(lcConfigs)).not.toThrowError();
            await expect(async () => await lcManager.start()).not.toThrowError();
            await expect(async () => await lcManager.dispose()).not.toThrowError();
        } catch (e) {
            console.error(`Unexpected error occured: ${e}`);
            error = true;
        }

        expect(error).toBe(false);
    });

});
