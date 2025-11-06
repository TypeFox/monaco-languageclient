/* --------------------------------------------------------------------------------------------
 * Copyright (c) 2024 TypeFox and others.
 * Licensed under the MIT License. See LICENSE in the package root for license information.
 * ------------------------------------------------------------------------------------------ */

import { LogLevel } from '@codingame/monaco-vscode-api';
import type { CodeResources, EditorAppConfig } from 'monaco-languageclient/editorApp';
import type { LanguageClientConfig } from 'monaco-languageclient/lcwrapper';
import { MessageTransports } from 'vscode-languageclient';

export const createDefaultEditorAppConfig = (codeResources: CodeResources, logLevel?: LogLevel): EditorAppConfig => {
    return {
        logLevel,
        codeResources
    };
};

export const createDefaultLcWorkerConfig = (worker: Worker, languageId: string,
    messageTransports?: MessageTransports): LanguageClientConfig => {
    return {
        languageId,
        clientOptions: {
            documentSelector: [languageId]
        },
        connection: {
            options: {
                $type: 'WorkerDirect',
                worker
            },
            messageTransports
        }
    };
};

export const createDefaultLanguageClientConfig = (): LanguageClientConfig => {
    const workerUrl = new URL('monaco-languageclient-examples/worker/langium', import.meta.url);
    const worker = new Worker(workerUrl, {
        type: 'module',
        name: 'Langium LS (React Test)'
    });
    return createDefaultLcWorkerConfig(worker, 'langium');
};

export const unmountDelayMs = 250;

export const cleanHtmlBody = () => {
    // manual clean document body
    document.body.innerHTML = '';
};
