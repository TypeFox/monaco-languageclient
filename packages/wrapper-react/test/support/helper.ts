/* --------------------------------------------------------------------------------------------
 * Copyright (c) 2024 TypeFox and others.
 * Licensed under the MIT License. See LICENSE in the package root for license information.
 * ------------------------------------------------------------------------------------------ */

import { LogLevel } from '@codingame/monaco-vscode-api';
import type { CodeResources, EditorAppConfig } from 'monaco-languageclient/editorApp';
import type { LanguageClientConfig, LanguageClientConfigs } from 'monaco-languageclient/lcwrapper';
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
        name: 'test-worker-direct',
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

export const createDefaultLanguageClientConfigs = (): LanguageClientConfigs => {
    const workerUrl = new URL('monaco-languageclient-examples/worker/langium', import.meta.url);
    const worker = new Worker(workerUrl, {
        type: 'module',
        name: 'Langium LS (React Test)'
    });
    const languageClientConfigs = {
        configs: {
            'langium': createDefaultLcWorkerConfig(worker, 'langium')
        }
    };
    return languageClientConfigs;
};
