/* --------------------------------------------------------------------------------------------
 * Copyright (c) 2024 TypeFox and others.
 * Licensed under the MIT License. See LICENSE in the package root for license information.
 * ------------------------------------------------------------------------------------------ */

import { MessageTransports } from 'vscode-languageclient';
import { LogLevel } from '@codingame/monaco-vscode-api';
import type { LanguageClientConfig } from 'monaco-languageclient/lcwrapper';
import type { CodeResources, WrapperConfig } from 'monaco-editor-wrapper';

export const createDefaultWrapperConfig = (codeResources: CodeResources, logLevel?: LogLevel): WrapperConfig => {
    return {
        $type: 'extended',
        logLevel,
        editorAppConfig: {
            codeResources
        }
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
                // create a web worker to pass to the wrapper
                worker
            },
            messageTransports
        }
    };
};
