/* --------------------------------------------------------------------------------------------
 * Copyright (c) 2026 TypeFox and others.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 * ------------------------------------------------------------------------------------------ */

import type { ILogger } from '@codingame/monaco-vscode-log-service-override';
import { useWorkerFactory, Worker, type PossibleWorkerLabelsClassic, type WorkerLoader } from 'monaco-languageclient/workerFactory';

export const defineClassicWorkers: () => Record<PossibleWorkerLabelsClassic, WorkerLoader> = () => {
  const editorWorkerServiceWorker = () => {
    const workerUrl = new URL('@codingame/monaco-vscode-editor-api/esm/vs/editor/editor.worker.js', import.meta.url);
    return new Worker(workerUrl, { type: 'module' });
  };

  const cssWorker = () => {
    const workerUrl = new URL('@codingame/monaco-vscode-standalone-css-language-features', import.meta.url);
    return new Worker(workerUrl, { type: 'module' });
  };

  const jsonWorker = () => {
    const workerUrl = new URL('@codingame/monaco-vscode-standalone-json-language-features', import.meta.url);
    return new Worker(workerUrl, { type: 'module' });
  };

  const htmlWorker = () => {
    const workerUrl = new URL('@codingame/monaco-vscode-standalone-html-language-features', import.meta.url);
    return new Worker(workerUrl, { type: 'module' });
  };

  const tsWorker = () => {
    const workerUrl = new URL('@codingame/monaco-vscode-standalone-typescript-language-features', import.meta.url);
    return new Worker(workerUrl, { type: 'module' });
  };

  return {
    editorWorkerService: editorWorkerServiceWorker,
    css: cssWorker,
    html: htmlWorker,
    json: jsonWorker,
    // both have to be defined otherwise this leads to a test error
    javascript: tsWorker,
    typescript: tsWorker
  };
};

export const configureClassicWorkerFactory = (logger?: ILogger) => {
  useWorkerFactory({
    workerLoaders: defineClassicWorkers(),
    logger
  });
};
