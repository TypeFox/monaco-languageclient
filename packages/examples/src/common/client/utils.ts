/* --------------------------------------------------------------------------------------------
 * Copyright (c) 2024 TypeFox and others.
 * Licensed under the MIT License. See LICENSE in the package root for license information.
 * ------------------------------------------------------------------------------------------ */

import { RegisteredMemoryFile } from '@codingame/monaco-vscode-files-service-override';
import type { IStoredWorkspace } from '@codingame/monaco-vscode-configuration-service-override';
import type { Uri } from 'vscode';

export const disableElement = (id: string, disabled: boolean) => {
    const button = document.getElementById(id) as HTMLButtonElement | HTMLInputElement | null;
    if (button !== null) {
        button.disabled = disabled;
    }
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

export const delayExecution = (ms: number) => {
    return new Promise((resolve) => setTimeout(resolve, ms));
};
