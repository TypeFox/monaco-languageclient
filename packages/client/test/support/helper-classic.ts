/* --------------------------------------------------------------------------------------------
 * Copyright (c) 2024 TypeFox and others.
 * Licensed under the MIT License. See LICENSE in the package root for license information.
 * ------------------------------------------------------------------------------------------ */

import { useWorkerFactory, type WorkerLoader } from 'monaco-languageclient/workerFactory';
import type { Logger } from 'monaco-languageclient/common';

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

const editorWorker = new Worker(
    new URL('@codingame/monaco-vscode-editor-api/esm/vs/editor/editor.worker.js', import.meta.url),
    { type: 'module' }
);

const cssWorker = new Worker(
    new URL('@codingame/monaco-vscode-standalone-css-language-features', import.meta.url),
    { type: 'module' }
);

const htmlWorker = new Worker(
    new URL('@codingame/monaco-vscode-standalone-html-language-features', import.meta.url),
    { type: 'module' }
);

const jsonWorker = new Worker(
    new URL('@codingame/monaco-vscode-standalone-json-language-features', import.meta.url),
    { type: 'module' }
);

const tsWorker = new Worker(
    new URL('@codingame/monaco-vscode-standalone-typescript-language-features', import.meta.url),
    { type: 'module' }
);

export const workerFuncs = {
    editorWorker: () => {
        pushAndPrintLastWorker('editorWorker');
        return editorWorker;
    },
    cssWorker: () => {
        pushAndPrintLastWorker('cssWorker');
        return cssWorker;
    },
    jsonWorker: () => {
        pushAndPrintLastWorker('jsonWorker');
        return jsonWorker;
    },
    htmlWorker: () => {
        pushAndPrintLastWorker('htmlWorker');
        return htmlWorker;
    },
    tsWorker: () => {
        pushAndPrintLastWorker('tsWorker');
        return tsWorker;
    }
};

export const defineClassisWorkerLoaders: () => Record<string, WorkerLoader> = () => {
    return {
        TextEditorWorker: workerFuncs.editorWorker,
        css: workerFuncs.cssWorker,
        html: workerFuncs.htmlWorker,
        json: workerFuncs.jsonWorker,
        // both have to be defined otherwise this leads to a test error
        javascript: workerFuncs.tsWorker,
        typescript: workerFuncs.tsWorker
    };
};

export const configureClassicWorkerFactory = (logger?: Logger) => {
    useWorkerFactory({
        workerLoaders: defineClassisWorkerLoaders(),
        logger
    });
};
