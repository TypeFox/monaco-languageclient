/* --------------------------------------------------------------------------------------------
 * Copyright (c) 2024 TypeFox and others.
 * Licensed under the MIT License. See LICENSE in the package root for license information.
 * ------------------------------------------------------------------------------------------ */

import { MessageTransports } from 'vscode-languageclient';
import type { LanguageClientConfig } from 'monaco-languageclient/wrapper';

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

export const createUnreachableWorkerConfig = (): LanguageClientConfig => {
    return {
        name: 'test-worker-unreachable',
        clientOptions: {
            documentSelector: ['javascript']
        },
        connection: {
            options: {
                $type: 'WorkerConfig',
                url: new URL(`${import.meta.url.split('@fs')[0]}/packages/wrapper/test/worker/langium-server.ts`),
                type: 'module'
            }
        }
    };
};

export const createDefaultLcUnreachableUrlConfig = (port: number): LanguageClientConfig => {
    return {
        name: 'test-ws-unreachable',
        clientOptions: {
            documentSelector: ['javascript']
        },
        connection: {
            options: {
                $type: 'WebSocketUrl',
                url: `ws://localhost:${port}/rester`
            },
        }
    };
};
