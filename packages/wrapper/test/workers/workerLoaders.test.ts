/* --------------------------------------------------------------------------------------------
 * Copyright (c) 2018-2022 TypeFox and others.
 * Licensed under the MIT License. See LICENSE in the package root for license information.
 * ------------------------------------------------------------------------------------------ */

import { beforeAll, describe, expect, test } from 'vitest';

import { LogLevel } from '@codingame/monaco-vscode-api';
import '@codingame/monaco-vscode-standalone-languages';
import '@codingame/monaco-vscode-standalone-css-language-features';
import '@codingame/monaco-vscode-standalone-html-language-features';
import '@codingame/monaco-vscode-standalone-json-language-features';
import '@codingame/monaco-vscode-standalone-typescript-language-features';
import { MonacoEditorLanguageClientWrapper } from 'monaco-editor-wrapper';
import { delayExecution } from '../support/helper.js';
import { clearLastWorkers, configureClassicWorkerFactory, createWrapperConfigClassicApp, getLastWorkers } from '../support/helper-classic.js';

describe('Test WorkerLoaders', () => {

    const workerLoadingTimeout = 250;

    const wrapper = new MonacoEditorLanguageClientWrapper();

    beforeAll(async () => {
        const wrapperConfig = createWrapperConfigClassicApp();
        wrapperConfig.logLevel = LogLevel.Info;
        wrapperConfig.editorAppConfig!.monacoWorkerFactory = configureClassicWorkerFactory;
        expect(await wrapper.initAndStart(wrapperConfig)).toBeUndefined();
    });

    test('Test default worker + js worker', async () => {
        // check default
        await delayExecution(workerLoadingTimeout);
        console.log('lastWorkers:', getLastWorkers());
        expect(getLastWorkers()).toContain('editorWorker');
        expect(getLastWorkers()).toContain('tsWorker');

        // clean-up
        clearLastWorkers();
        expect(getLastWorkers()).toEqual([]);
    });

    test('Test ts worker', async () => {
        // ts loads the same worker
        await wrapper.updateCodeResources({
            modified: {
                text: '',
                fileExt: 'ts',
                enforceLanguageId: 'ts'
            }
        });
        await delayExecution(workerLoadingTimeout);
        console.log('lastWorkers:', getLastWorkers());
        expect(getLastWorkers()).toEqual([]);

        clearLastWorkers();
        expect(getLastWorkers()).toEqual([]);
    });

    test('Test css worker', async () => {
        await wrapper.updateCodeResources({
            modified: {
                text: '',
                fileExt: 'css',
                enforceLanguageId: 'css'
            }
        });
        await delayExecution(workerLoadingTimeout);
        console.log('lastWorkers:', getLastWorkers());
        expect(getLastWorkers()).toContain('cssWorker');

        clearLastWorkers();
        expect(getLastWorkers()).toEqual([]);
    });

    test('Test json worker', async () => {
        await wrapper.updateCodeResources({
            modified: {
                text: '',
                fileExt: 'json',
                enforceLanguageId: 'json'
            }
        });
        await delayExecution(workerLoadingTimeout);
        console.log('lastWorkers:', getLastWorkers());
        expect(getLastWorkers()).toContain('jsonWorker');

        clearLastWorkers();
        expect(getLastWorkers()).toEqual([]);
    });

    test('Test html worker', async () => {
        await wrapper.updateCodeResources({
            modified: {
                text: '',
                fileExt: 'html',
                enforceLanguageId: 'html'
            }
        });

        await delayExecution(workerLoadingTimeout);
        console.log('lastWorkers:', getLastWorkers());
        expect(getLastWorkers()).toContain('htmlWorker');

        clearLastWorkers();
        expect(getLastWorkers()).toEqual([]);
    });
});
