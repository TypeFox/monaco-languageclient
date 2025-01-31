/* --------------------------------------------------------------------------------------------
 * Copyright (c) 2024 TypeFox and others.
 * Licensed under the MIT License. See LICENSE in the package root for license information.
 * ------------------------------------------------------------------------------------------ */

import { Uri } from 'vscode';
import { Logger } from 'monaco-languageclient/tools';
import { useWorkerFactory, WorkerLoader } from 'monaco-languageclient/workerFactory';
import { RegisteredMemoryFile } from '@codingame/monaco-vscode-files-service-override';
import { IStoredWorkspace } from '@codingame/monaco-vscode-configuration-service-override';

export const disableElement = (id: string, disabled: boolean) => {
    const button = document.getElementById(id) as HTMLButtonElement | HTMLInputElement | null;
    if (button !== null) {
        button.disabled = disabled;
    }
};

export const defineDefaultWorkerLoaders: () => Record<string, WorkerLoader> = () => {
    return {
        // if you import monaco api as 'monaco-editor': monaco-editor/esm/vs/editor/editor.worker.js
        TextEditorWorker: () => new Worker(
            new URL('@codingame/monaco-vscode-editor-api/esm/vs/editor/editor.worker.js', import.meta.url),
            { type: 'module' }
        ),
        TextMateWorker: () => new Worker(
            new URL('@codingame/monaco-vscode-textmate-service-override/worker', import.meta.url),
            { type: 'module' }
        ),
        // these are other possible workers not configured by default
        OutputLinkDetectionWorker: undefined,
        LanguageDetectionWorker: undefined,
        NotebookEditorWorker: undefined,
        LocalFileSearchWorker: undefined
    };
};

export const configureMonacoWorkers = (logger?: Logger) => {
    useWorkerFactory({
        workerLoaders: defineDefaultWorkerLoaders(),
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
