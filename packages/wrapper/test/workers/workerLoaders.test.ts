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
import { awaitWorkerPromises, configureClassicWorkerFactory, createWorkerPromises, createWrapperConfigClassicApp } from '../support/helper-classic.js';

describe('Test WorkerLoaders', () => {

    test('Test default worker application', async () => {
        // prepare
        const wrapper = new MonacoEditorLanguageClientWrapper();
        const wrapperConfig = createWrapperConfigClassicApp();
        wrapperConfig.logLevel = LogLevel.Info;
        wrapperConfig.editorAppConfig!.monacoWorkerFactory = configureClassicWorkerFactory;

        // default, expect editor and ts worker to be loaded
        createWorkerPromises(['editorWorker', 'tsWorker']);
        expect(await wrapper.initAndStart(wrapperConfig)).toBeUndefined();
        expect(await awaitWorkerPromises()).toStrictEqual([undefined, undefined]);

        // ts worker, expect no worker to be loaded
        createWorkerPromises([]);
        await wrapper.updateCodeResources({
            modified: {
                text: '',
                fileExt: 'ts',
                enforceLanguageId: 'ts'
            }
        });
        expect(await awaitWorkerPromises()).toStrictEqual([]);

        // css worker
        createWorkerPromises(['cssWorker']);
        await wrapper.updateCodeResources({
            modified: {
                text: '',
                fileExt: 'css',
                enforceLanguageId: 'css'
            }
        });
        expect(await awaitWorkerPromises()).toStrictEqual([undefined]);

        console.log('done');

        // json worker
        createWorkerPromises(['jsonWorker']);
        await wrapper.updateCodeResources({
            modified: {
                text: '',
                fileExt: 'json',
                enforceLanguageId: 'json'
            }
        });
        expect(await awaitWorkerPromises()).toStrictEqual([undefined]);

        // html worker
        createWorkerPromises(['htmlWorker']);
        await wrapper.updateCodeResources({
            modified: {
                text: '',
                fileExt: 'html',
                enforceLanguageId: 'html'
            }
        });
        expect(await awaitWorkerPromises()).toStrictEqual([undefined]);
    });
});
