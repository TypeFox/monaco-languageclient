/* --------------------------------------------------------------------------------------------
 * Copyright (c) 2024 TypeFox and others.
 * Licensed under the MIT License. See LICENSE in the package root for license information.
 * ------------------------------------------------------------------------------------------ */

import type { ILogger } from '@codingame/monaco-vscode-log-service-override';
import { useWorkerFactory, Worker, type WorkerLoader } from 'monaco-languageclient/workerFactory';

const workerResolver: Map<string, (value: void | PromiseLike<void>) => void> = new Map();
const workerPromises: Map<string, Promise<void>> = new Map();
export const createWorkerPromises = (keys: string[]) => {
    workerResolver.clear();
    workerPromises.clear();
    for (const key of keys) {
        const promise = new Promise<void>(resolve => {
            workerResolver.set(key, resolve);
        });
        workerPromises.set(key, promise);
    }
};

export const awaitWorkerPromises = () => {
    return Promise.all([...workerPromises.values()]);
};

export const pushAndPrintLastWorker = (lastWorker: string) => {
    console.log(`Called: ${lastWorker}`);
    workerResolver.get(lastWorker)?.();
};

export const defineClassicWorkers: () => Partial<Record<string, WorkerLoader>> = () => {
    const editorWorkerServiceWorker = () => {
        pushAndPrintLastWorker('editorWorker');
        return new Worker(
            new URL('@codingame/monaco-vscode-editor-api/esm/vs/editor/editor.worker.js', import.meta.url),
            { type: 'module' }
        );
    };
    const cssWorker = () => {
        pushAndPrintLastWorker('cssWorker');
        return new Worker(
            new URL('@codingame/monaco-vscode-standalone-css-language-features', import.meta.url),
            { type: 'module' }
        );
    };
    const jsonWorker = () => {
        pushAndPrintLastWorker('jsonWorker');
        return new Worker(
            new URL('@codingame/monaco-vscode-standalone-json-language-features', import.meta.url),
            { type: 'module' }
        );
    };
    const htmlWorker = () => {
        pushAndPrintLastWorker('htmlWorker');
        return new Worker(
            new URL('@codingame/monaco-vscode-standalone-html-language-features', import.meta.url),
            { type: 'module' }
        );
    };
    const tsWorker = () => {
        pushAndPrintLastWorker('tsWorker');
        return new Worker(
            new URL('@codingame/monaco-vscode-standalone-typescript-language-features', import.meta.url),
            { type: 'module' }
        );
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
