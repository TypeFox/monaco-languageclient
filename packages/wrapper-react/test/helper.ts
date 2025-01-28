/* --------------------------------------------------------------------------------------------
 * Copyright (c) 2024 TypeFox and others.
 * Licensed under the MIT License. See LICENSE in the package root for license information.
 * ------------------------------------------------------------------------------------------ */

import { useWorkerFactory } from 'monaco-editor-wrapper/workerFactory';

export const configureMonacoWorkers = () => {
    useWorkerFactory({
        workerLoaders: {
            TextEditorWorker: () => new Worker(new URL('@codingame/monaco-vscode-editor-api/esm/vs/editor/editor.worker.js', import.meta.url), { type: 'module' }),
        }
    });
};
