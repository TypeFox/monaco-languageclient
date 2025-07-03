/* --------------------------------------------------------------------------------------------
 * Copyright (c) 2024 TypeFox and others.
 * Licensed under the MIT License. See LICENSE in the package root for license information.
 * ------------------------------------------------------------------------------------------ */

import type { Logger } from 'monaco-languageclient/common';
import { useWorkerFactory, type WorkerLoader } from 'monaco-languageclient/workerFactory';

export const defineDefaultWorkerLoaders: () => Record<string, WorkerLoader> = () => {
    const defaultTextEditorWorker = () => new Worker(
        new URL('@codingame/monaco-vscode-editor-api/esm/vs/editor/editor.worker.js', import.meta.url),
        { type: 'module' }
    );
    const defaultTextMateWorker = () => new Worker(
        new URL('@codingame/monaco-vscode-textmate-service-override/worker', import.meta.url),
        { type: 'module' }
    );

    return {
        // if you import monaco api as 'monaco-editor': monaco-editor/esm/vs/editor/editor.worker.js
        TextEditorWorker: defaultTextEditorWorker,
        TextMateWorker: defaultTextMateWorker,
        // these are other possible workers not configured by default
        OutputLinkDetectionWorker: undefined,
        LanguageDetectionWorker: undefined,
        NotebookEditorWorker: undefined,
        LocalFileSearchWorker: undefined
    };
};

export const configureDefaultWorkerFactory = (logger?: Logger) => {
    useWorkerFactory({
        workerLoaders: defineDefaultWorkerLoaders(),
        logger
    });
};
