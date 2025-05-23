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
        const wrapperConfig = createWrapperConfigClassicApp({
            modified: {
                text: 'const text = "Hello World!";',
                uri: `/workspace/${expect.getState().testPath}.js`,
                enforceLanguageId: 'javascript'
            }
        });
        wrapperConfig.logLevel = LogLevel.Info;
        wrapperConfig.editorAppConfig!.monacoWorkerFactory = configureClassicWorkerFactory;

        // default, expect editor and ts worker to be loaded
        createWorkerPromises(['editorWorker', 'tsWorker']);
        await expect(await wrapper.initAndStart(wrapperConfig)).toBeUndefined();
        await expect(await awaitWorkerPromises()).toStrictEqual([undefined, undefined]);

        const app = wrapper.getEditorApp();
        app?.setModelRefDisposeTimeout(1000);

        // ts worker, expect no worker to be loaded
        createWorkerPromises([]);
        await wrapper.updateCodeResources({
            modified: {
                text: '',
                uri: `/workspace/${expect.getState().testPath}.ts`,
                enforceLanguageId: 'typescript'
            }
        });
        await expect(await awaitWorkerPromises()).toStrictEqual([]);

        // css worker
        createWorkerPromises(['cssWorker']);
        await wrapper.updateCodeResources({
            modified: {
                text: '',
                uri: `/workspace/${expect.getState().testPath}.css`,
                enforceLanguageId: 'css'
            }
        });
        await expect(await awaitWorkerPromises()).toStrictEqual([undefined]);

        console.log('done');

        // json worker
        createWorkerPromises(['jsonWorker']);
        await wrapper.updateCodeResources({
            modified: {
                text: '',
                uri: `/workspace/${expect.getState().testPath}.json`,
                enforceLanguageId: 'json'
            }
        });
        await expect(await awaitWorkerPromises()).toStrictEqual([undefined]);

        // html worker
        createWorkerPromises(['htmlWorker']);
        await wrapper.updateCodeResources({
            modified: {
                text: '',
                uri: `/workspace/${expect.getState().testPath}.html`,
                enforceLanguageId: 'html'
            }
        });
        await expect(await awaitWorkerPromises()).toStrictEqual([undefined]);
    });

});
