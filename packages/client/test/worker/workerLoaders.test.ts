/* --------------------------------------------------------------------------------------------
 * Copyright (c) 2025 TypeFox and others.
 * Licensed under the MIT License. See LICENSE in the package root for license information.
 * ------------------------------------------------------------------------------------------ */

import { describe, expect, test } from 'vitest';

import '@codingame/monaco-vscode-standalone-css-language-features';
import '@codingame/monaco-vscode-standalone-html-language-features';
import '@codingame/monaco-vscode-standalone-json-language-features';
import '@codingame/monaco-vscode-standalone-languages';
import '@codingame/monaco-vscode-standalone-typescript-language-features';
import { EditorApp } from 'monaco-languageclient/editorApp';
import { MonacoVscodeApiWrapper } from 'monaco-languageclient/vscodeApiWrapper';
import { awaitWorkerPromises, configureClassicWorkerFactory, createWorkerPromises } from '../support/helper-classic.js';
import { createDefaultMonacoVscodeApiConfig, createMonacoEditorDiv } from '../support/helper.js';

describe.concurrent('Test WorkerLoaders', { concurrent: false }, () => {
  test('Test default worker application', async () => {
    const htmlContainer = createMonacoEditorDiv();
    const apiConfig = createDefaultMonacoVscodeApiConfig('extended', htmlContainer, 'EditorService');
    apiConfig.monacoWorkerFactory = configureClassicWorkerFactory;
    const apiWrapper = new MonacoVscodeApiWrapper(apiConfig);
    await apiWrapper.start();

    const editorApp = new EditorApp({
      codeResources: {
        modified: {
          text: '',
          uri: `/workspace/${expect.getState().testPath}.txt`
        }
      }
    });
    // default, expect editor worker to be loaded
    createWorkerPromises(['editorWorker']);
    await editorApp.start(htmlContainer);
    expect(await awaitWorkerPromises()).toStrictEqual([undefined]);
    await editorApp.disposeModelRefs();

    // ts worker, expect ts worker and json worker to be loaded
    createWorkerPromises(['tsWorker', 'jsonWorker']);
    await editorApp.updateCodeResources({
      modified: {
        text: '',
        uri: `/workspace/${expect.getState().testPath}.ts`
      }
    });
    expect(await awaitWorkerPromises()).toStrictEqual([undefined, undefined]);
    await editorApp.disposeModelRefs();

    createWorkerPromises(['cssWorker']);
    await editorApp.updateCodeResources({
      modified: {
        text: '',
        uri: `/workspace/${expect.getState().testPath}.css`
      }
    });
    expect(await awaitWorkerPromises()).toStrictEqual([undefined]);
    await editorApp.disposeModelRefs();

    createWorkerPromises(['htmlWorker']);
    await editorApp.updateCodeResources({
      modified: {
        text: '',
        uri: `/workspace/${expect.getState().testPath}.html`
      }
    });
    expect(await awaitWorkerPromises()).toStrictEqual([undefined]);
    await editorApp.disposeModelRefs();

    createWorkerPromises([]);
    await editorApp.updateCodeResources({
      modified: {
        text: 'blah',
        uri: `/workspace/${expect.getState().testPath}.json`
      }
    });
    expect(await awaitWorkerPromises()).toStrictEqual([]);
    await editorApp.disposeModelRefs();
  });
});
