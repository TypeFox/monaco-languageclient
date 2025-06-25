/* --------------------------------------------------------------------------------------------
 * Copyright (c) 2018-2022 TypeFox and others.
 * Licensed under the MIT License. See LICENSE in the package root for license information.
 * ------------------------------------------------------------------------------------------ */

import { beforeAll, describe, expect, test } from 'vitest';

import * as monaco from '@codingame/monaco-vscode-editor-api';
import '@codingame/monaco-vscode-standalone-languages';
import '@codingame/monaco-vscode-standalone-css-language-features';
import '@codingame/monaco-vscode-standalone-html-language-features';
import '@codingame/monaco-vscode-standalone-json-language-features';
import '@codingame/monaco-vscode-standalone-typescript-language-features';
import { MonacoVscodeApiWrapper } from 'monaco-languageclient/vscodeApiWrapper';
import { awaitWorkerPromises, configureClassicWorkerFactory, createWorkerPromises } from '../support/helper-classic.js';
import { createDefaultMonacoVscodeApiConfig, createMonacoEditorDiv } from '../support/helper.js';
import { createModelReference } from '@codingame/monaco-vscode-api/monaco';

describe('Test WorkerLoaders', () => {

    let editor: monaco.editor.IStandaloneCodeEditor;
    const htmlContainer = createMonacoEditorDiv();

    beforeAll(async () => {
        const apiConfig = createDefaultMonacoVscodeApiConfig(htmlContainer);
        apiConfig.monacoWorkerFactory = configureClassicWorkerFactory;
        const apiWrapper = new MonacoVscodeApiWrapper(apiConfig);
        await apiWrapper.init();

        editor = monaco.editor.create(htmlContainer, {
            value: 'const text = "Hello World!";',
            language: 'javascript'
        });
    });

    test.sequential('Test default worker application', async () => {
        // default, expect editor and ts worker to be loaded
        createWorkerPromises(['editorWorker', 'tsWorker']);
        await expect(await awaitWorkerPromises()).toStrictEqual([undefined, undefined]);
    });

    test.sequential('Test TS worker application', async () => {
        // ts worker, expect no worker to be loaded
        createWorkerPromises([]);
        const modelRefTs = await createModelReference(monaco.Uri.parse(`/workspace/${expect.getState().testPath}.ts`), '');
        editor.setModel(modelRefTs.object.textEditorModel);
        await expect(await awaitWorkerPromises()).toStrictEqual([]);
    });

    test.sequential('Test CSS worker application', async () => {
        createWorkerPromises(['cssWorker']);
        const modelRefCss = await createModelReference(monaco.Uri.parse(`/workspace/${expect.getState().testPath}.css`), '');
        editor.setModel(modelRefCss.object.textEditorModel);
        await expect(await awaitWorkerPromises()).toStrictEqual([undefined]);
    });

    test.sequential('Test JSON worker application', async () => {
        createWorkerPromises(['jsonWorker']);
        const modelRefJson = await createModelReference(monaco.Uri.parse(`/workspace/${expect.getState().testPath}.json`), '');
        editor.setModel(modelRefJson.object.textEditorModel);
        await expect(await awaitWorkerPromises()).toStrictEqual([undefined]);
    });

    test.sequential('Test HTML worker application', async () => {
        createWorkerPromises(['htmlWorker']);
        const modelRefHtml = await createModelReference(monaco.Uri.parse(`/workspace/${expect.getState().testPath}.html`), '');
        editor.setModel(modelRefHtml.object.textEditorModel);
        await expect(await awaitWorkerPromises()).toStrictEqual([undefined]);
    });

});
