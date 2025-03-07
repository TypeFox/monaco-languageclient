/* --------------------------------------------------------------------------------------------
 * Copyright (c) 2024 TypeFox and others.
 * Licensed under the MIT License. See LICENSE in the package root for license information.
 * ------------------------------------------------------------------------------------------ */

import type { LanguageClientConfig, WrapperConfig } from 'monaco-editor-wrapper';
import { configureDefaultWorkerFactory } from 'monaco-editor-wrapper/workers/workerLoaders';

export const createMonacoEditorDiv = () => {
    const div = document.createElement('div');
    div.id = 'monaco-editor-root';
    document.body.insertAdjacentElement('beforeend', div);
    return div;
};

export const createWrapperConfigExtendedApp = (): WrapperConfig => {
    return {
        $type: 'extended',
        htmlContainer: createMonacoEditorDiv(),
        vscodeApiConfig: {
            loadThemes: false
        },
        editorAppConfig: {
            codeResources: {
                modified: {
                    text: 'console.log("Hello World!");',
                    uri: '/workspace/test.js'
                }
            },
            monacoWorkerFactory: configureDefaultWorkerFactory
        }
    };
};

export const createDefaultLcWorkerConfig = (worker: Worker): LanguageClientConfig => {
    return {
        name: 'test-worker-direct',
        clientOptions: {
            documentSelector: ['javascript']
        },
        connection: {
            options: {
                $type: 'WorkerDirect',
                // create a web worker to pass to the wrapper
                worker
            }
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

export const createDefaultLcUnreachableUrlConfig = (): LanguageClientConfig => {
    return {
        name: 'test-ws-unreachable',
        clientOptions: {
            documentSelector: ['javascript']
        },
        connection: {
            options: {
                $type: 'WebSocketUrl',
                url: 'ws://localhost:12345/Tester'
            },
        }
    };
};
