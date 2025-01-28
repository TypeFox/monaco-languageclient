/* --------------------------------------------------------------------------------------------
 * Copyright (c) 2024 TypeFox and others.
 * Licensed under the MIT License. See LICENSE in the package root for license information.
 * ------------------------------------------------------------------------------------------ */

import { Uri } from 'vscode';
import { Logger } from 'monaco-languageclient/tools';
import { useWorkerFactory } from 'monaco-editor-wrapper/workerFactory';
import { RegisteredMemoryFile } from '@codingame/monaco-vscode-files-service-override';
import { IStoredWorkspace } from '@codingame/monaco-vscode-configuration-service-override';

export const disableElement = (id: string, disabled: boolean) => {
    const button = document.getElementById(id) as HTMLButtonElement | HTMLInputElement | null;
    if (button !== null) {
        button.disabled = disabled;
    }
};

export const configureMonacoWorkers = (logger?: Logger) => {
    useWorkerFactory({
        workerLoaders: {
            TextEditorWorker: () => new Worker(new URL('@codingame/monaco-vscode-editor-api/esm/vs/editor/editor.worker.js', import.meta.url), { type: 'module' }),
            TextMateWorker: () => new Worker(new URL('@codingame/monaco-vscode-textmate-service-override/worker', import.meta.url), { type: 'module' })
        },
        logger
    });
};

export const createDefaultWorkspaceFile = (workspaceFile: Uri, workspacePath: string) => {
    return new RegisteredMemoryFile(
        workspaceFile,
        JSON.stringify(
            <IStoredWorkspace>{
                folders: [
                    {
                        path: workspacePath
                    }
                ]
            },
            null,
            2
        )
    );
};
