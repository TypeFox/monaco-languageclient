/* --------------------------------------------------------------------------------------------
 * Copyright (c) 2024 TypeFox and others.
 * Licensed under the MIT License. See LICENSE in the package root for license information.
 * ------------------------------------------------------------------------------------------ */

import { Logger } from 'monaco-languageclient/tools';
import { useWorkerFactory } from 'monaco-editor-wrapper/workerFactory';

export const disableButton = (id: string, disabled: boolean) => {
    const button = document.getElementById(id) as HTMLButtonElement | null;
    if (button !== null) {
        button.disabled = disabled;
    }
};

export const configureMonacoWorkers = (logger?: Logger) => {
    useWorkerFactory({
        workerOverrides: {
            ignoreMapping: true,
            workerLoaders: {
                TextEditorWorker: () => new Worker(new URL('monaco-editor/esm/vs/editor/editor.worker.js', import.meta.url), { type: 'module' }),
                TextMateWorker: () => new Worker(new URL('@codingame/monaco-vscode-textmate-service-override/worker', import.meta.url), { type: 'module' })
            }
        },
        logger
    });
};
