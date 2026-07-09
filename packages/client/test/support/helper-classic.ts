/* --------------------------------------------------------------------------------------------
 * Copyright (c) 2024 TypeFox and others.
 * Licensed under the MIT License. See LICENSE in the package root for license information.
 * ------------------------------------------------------------------------------------------ */

import type { ILogger } from '@codingame/monaco-vscode-log-service-override';
import {
  useWorkerFactory,
  Worker,
  type PossibleWorkerLabelsClassic,
  type PossibleWorkerLabelsExtended,
  type WorkerLoader
} from 'monaco-languageclient/workerFactory';

const workerResolver: Map<PossibleWorkerLabelsExtended | PossibleWorkerLabelsClassic, (value: void | PromiseLike<void>) => void> =
  new Map();
const workerPromises: Map<PossibleWorkerLabelsExtended | PossibleWorkerLabelsClassic, Promise<void>> = new Map();
export const createWorkerPromises = (keys: Array<PossibleWorkerLabelsExtended | PossibleWorkerLabelsClassic>) => {
  workerResolver.clear();
  workerPromises.clear();
  for (const key of keys) {
    const promise = new Promise<void>((resolve) => {
      workerResolver.set(key, resolve);
    });
    workerPromises.set(key, promise);
  }
};

export const awaitWorkerPromises = () => {
  return Promise.all([...workerPromises.values()]);
};

const pushAndPrintLastWorker = (lastWorker: PossibleWorkerLabelsExtended | PossibleWorkerLabelsClassic) => {
  console.log(`Called: ${lastWorker}\n`);
  workerResolver.get(lastWorker)?.();
};

const defineClassicWorkers: () => Partial<Record<PossibleWorkerLabelsExtended | PossibleWorkerLabelsClassic, WorkerLoader>> = () => {
  const editorWorkerServiceWorker = () => {
    const workerUrl = new URL('@codingame/monaco-vscode-editor-api/esm/vs/editor/editor.worker.js', import.meta.url);
    const worker = new Worker(workerUrl, {
      type: 'module'
    });
    pushAndPrintLastWorker('editorWorkerService');
    return worker;
  };

  const cssWorker = () => {
    const workerUrl = new URL('@codingame/monaco-vscode-standalone-css-language-features', import.meta.url);
    const worker = new Worker(workerUrl, { type: 'module' });
    pushAndPrintLastWorker('css');
    return worker;
  };

  const jsonWorker = () => {
    const workerUrl = new URL('@codingame/monaco-vscode-standalone-json-language-features', import.meta.url);
    const worker = new Worker(workerUrl, { type: 'module' });
    pushAndPrintLastWorker('json');
    return worker;
  };

  const htmlWorker = () => {
    const workerUrl = new URL('@codingame/monaco-vscode-standalone-html-language-features', import.meta.url);
    const worker = new Worker(workerUrl, { type: 'module' });
    pushAndPrintLastWorker('html');
    return worker;
  };

  const tsWorker = () => {
    const workerUrl = new URL('@codingame/monaco-vscode-standalone-typescript-language-features', import.meta.url);
    const worker = new Worker(workerUrl, { type: 'module' });
    pushAndPrintLastWorker('typescript');
    return worker;
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
