/* --------------------------------------------------------------------------------------------
 * Copyright (c) 2024 TypeFox and others.
 * Licensed under the MIT License. See LICENSE in the package root for license information.
 * ------------------------------------------------------------------------------------------ */

import { LogLevel } from '@codingame/monaco-vscode-api';
import type { WrapperConfig } from 'monaco-editor-wrapper';
import { useWorkerFactory } from 'monaco-languageclient/workerFactory';

export const configureMonacoWorkers = () => {
    useWorkerFactory({
        workerLoaders: {
            TextEditorWorker: () => new Worker(new URL('@codingame/monaco-vscode-editor-api/esm/vs/editor/editor.worker.js', import.meta.url), { type: 'module' }),
        }
    });
};

export const createDefaultWrapperConfig = (): WrapperConfig => {
    return {
        $type: 'extended',
        logLevel: LogLevel.Debug,
        vscodeApiConfig: {
            loadThemes: false
        },
        editorAppConfig: {
            codeResources: {
                modified: {
                    text: 'hello world',
                    fileExt: 'js'
                }
            },
            monacoWorkerFactory: configureMonacoWorkers
        }
    };
};
