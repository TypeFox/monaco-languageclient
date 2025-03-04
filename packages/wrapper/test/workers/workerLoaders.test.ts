/* --------------------------------------------------------------------------------------------
 * Copyright (c) 2018-2022 TypeFox and others.
 * Licensed under the MIT License. See LICENSE in the package root for license information.
 * ------------------------------------------------------------------------------------------ */

import { describe, expect, test } from 'vitest';

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

    test('Test default worker application', async () => {
        // prepare
        const defaultWorkerLoadingTimeout = 1000;
        const wrapper = new MonacoEditorLanguageClientWrapper();
        const wrapperConfig = createWrapperConfigClassicApp();
        wrapperConfig.logLevel = LogLevel.Info;
        wrapperConfig.editorAppConfig!.monacoWorkerFactory = configureClassicWorkerFactory;

        expect(await wrapper.initAndStart(wrapperConfig)).toBeUndefined();

        // check default and delay excution more than for the other worker tests
        await delayExecution(10000);
        console.log('lastWorkers:', getLastWorkers());
        expect(getLastWorkers()).toContain('editorWorker');
        expect(getLastWorkers()).toContain('tsWorker');

        // clean-up
        clearLastWorkers();
        expect(getLastWorkers()).toEqual([]);

        // ts worker
        // it loads the same worker
        await wrapper.updateCodeResources({
            modified: {
                text: '',
                fileExt: 'ts',
                enforceLanguageId: 'ts'
            }
        });
        await delayExecution(defaultWorkerLoadingTimeout);
        console.log('lastWorkers:', getLastWorkers());
        expect(getLastWorkers()).toEqual([]);

        clearLastWorkers();
        expect(getLastWorkers()).toEqual([]);

        // css worker
        await wrapper.updateCodeResources({
            modified: {
                text: '',
                fileExt: 'css',
                enforceLanguageId: 'css'
            }
        });
        await delayExecution(defaultWorkerLoadingTimeout);
        console.log('lastWorkers:', getLastWorkers());
        expect(getLastWorkers()).toContain('cssWorker');

        clearLastWorkers();
        expect(getLastWorkers()).toEqual([]);

        // json worker
        await wrapper.updateCodeResources({
            modified: {
                text: '',
                fileExt: 'json',
                enforceLanguageId: 'json'
            }
        });
        await delayExecution(defaultWorkerLoadingTimeout);
        console.log('lastWorkers:', getLastWorkers());
        expect(getLastWorkers()).toContain('jsonWorker');

        clearLastWorkers();
        expect(getLastWorkers()).toEqual([]);

        // html worker
        await wrapper.updateCodeResources({
            modified: {
                text: '',
                fileExt: 'html',
                enforceLanguageId: 'html'
            }
        });

        await delayExecution(defaultWorkerLoadingTimeout);
        console.log('lastWorkers:', getLastWorkers());
        expect(getLastWorkers()).toContain('htmlWorker');

        clearLastWorkers();
        expect(getLastWorkers()).toEqual([]);
    });
});
