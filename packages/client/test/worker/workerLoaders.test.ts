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
import { getEnhancedMonacoEnvironment, MonacoVscodeApiWrapper } from 'monaco-languageclient/vscodeApiWrapper';
import { awaitWorkerPromises, configureClassicWorkerFactory, createWorkerPromises } from '../support/helper-classic.js';
import { createDefaultMonacoVscodeApiConfig, createMonacoEditorDiv } from '../support/helper.js';

describe.concurrent('Test WorkerLoaders', { concurrent: false, tags: ['worker'] }, () => {
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

    const editorWorkerUrl = getEnhancedMonacoEnvironment().getWorkerUrl?.('test', 'editorWorkerService');
    const editorWorkerCheck = getEnhancedMonacoEnvironment().getWorker?.('test', 'editorWorkerService');
    expect(editorWorkerCheck).toBeUndefined();
    console.log(`editorWorkerUrl: ${editorWorkerUrl} worker: ${editorWorkerCheck !== undefined}\n`);

    // default, expect editor worker to be loaded
    createWorkerPromises(['editorWorkerService']);
    await editorApp.start(htmlContainer);
    expect(await awaitWorkerPromises()).toStrictEqual([undefined]);
    await editorApp.disposeModelRefs();

    const tsWorkerUrl = getEnhancedMonacoEnvironment().getWorkerUrl?.('test', 'typescript');
    const tsWorkerCheck = getEnhancedMonacoEnvironment().getWorker?.('test', 'typescript');
    expect(tsWorkerCheck).toBeUndefined();
    console.log(`tsWorkerUrl: ${tsWorkerUrl} worker: ${tsWorkerCheck !== undefined}\n`);

    const jsonWorkerUrl = getEnhancedMonacoEnvironment().getWorkerUrl?.('test', 'json');
    const jsonWorkerCheck = getEnhancedMonacoEnvironment().getWorker?.('test', 'json');
    expect(jsonWorkerCheck).toBeUndefined();
    console.log(`jsonWorkerUrl: ${jsonWorkerUrl} worker: ${jsonWorkerCheck !== undefined}\n`);

    // ts worker, expect ts worker and json worker to be loaded
    createWorkerPromises(['typescript', 'json']);
    await editorApp.updateCodeResources({
      modified: {
        text: '',
        uri: `/workspace/${expect.getState().testPath}.ts`
      }
    });
    expect(await awaitWorkerPromises()).toStrictEqual([undefined, undefined]);
    await editorApp.disposeModelRefs();

    const cssWorkerUrl = getEnhancedMonacoEnvironment().getWorkerUrl?.('test', 'css');
    const cssWorkerCheck = getEnhancedMonacoEnvironment().getWorker?.('test', 'css');
    expect(cssWorkerCheck).toBeUndefined();
    console.log(`cssWorkerUrl: ${cssWorkerUrl} worker: ${cssWorkerCheck !== undefined}\n`);

    createWorkerPromises(['css']);
    await editorApp.updateCodeResources({
      modified: {
        text: '',
        uri: `/workspace/${expect.getState().testPath}.css`
      }
    });
    expect(await awaitWorkerPromises()).toStrictEqual([undefined]);
    await editorApp.disposeModelRefs();

    const htmlWorkerUrl = getEnhancedMonacoEnvironment().getWorkerUrl?.('test', 'html');
    const htmlWorkerCheck = getEnhancedMonacoEnvironment().getWorker?.('test', 'html');
    expect(htmlWorkerCheck).toBeUndefined();
    console.log(`htmlWorkerUrl: ${htmlWorkerUrl} worker: ${htmlWorkerCheck !== undefined}\n`);

    createWorkerPromises(['html']);
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
