/* --------------------------------------------------------------------------------------------
 * Copyright (c) 2024 TypeFox and others.
 * Licensed under the MIT License. See LICENSE in the package root for license information.
 * ------------------------------------------------------------------------------------------ */

import { useWorkerFactory, type WorkerLoader } from 'monaco-languageclient/workerFactory';
import type { Logger } from 'monaco-languageclient/tools';
import type { WrapperConfig } from 'monaco-editor-wrapper';
import { createMonacoEditorDiv } from './helper.js';

const editorWorker = new Worker(
    new URL('monaco-editor-wrapper/workers/module/editor', import.meta.url),
    { type: 'module' }
);

const cssWorker = new Worker(
    new URL('monaco-editor-wrapper/workers/module/css', import.meta.url),
    { type: 'module' }
);

const htmlWorker = new Worker(
    new URL('monaco-editor-wrapper/workers/module/html', import.meta.url),
    { type: 'module' }
);

const jsonWorker = new Worker(
    new URL('monaco-editor-wrapper/workers/module/json', import.meta.url),
    { type: 'module' }
);

const tsWorker = new Worker(
    new URL('monaco-editor-wrapper/workers/module/ts', import.meta.url),
    { type: 'module' }
);

let lastWorkers: string[] = [];
export const getLastWorkers = () => {
    return lastWorkers;
};

export const clearLastWorkers = () => {
    lastWorkers = [];
};

export const pushAndPrintLastWorker = (lastWorker: string) => {
    lastWorkers.push(lastWorker);
    console.log(`Called: ${lastWorkers[lastWorkers.length - 1]}`);
};

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
        javascript: workerFuncs.tsWorker
    };
};

export const configureClassicWorkerFactory = (logger?: Logger) => {
    useWorkerFactory({
        workerLoaders: defineClassisWorkerLoaders(),
        logger
    });
};

export const createWrapperConfigClassicApp = (): WrapperConfig => {
    return {
        $type: 'classic',
        htmlContainer: createMonacoEditorDiv(),
        vscodeApiConfig: {
            loadThemes: false
        },
        editorAppConfig: {
            codeResources: {
                modified: {
                    text: '',
                    fileExt: 'js'
                }
            },
            monacoWorkerFactory: configureClassicWorkerFactory
        }
    };
};
