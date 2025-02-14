/* --------------------------------------------------------------------------------------------
 * Copyright (c) 2024 TypeFox and others.
 * Licensed under the MIT License. See LICENSE in the package root for license information.
 * ------------------------------------------------------------------------------------------ */

import { useWorkerFactory } from 'monaco-languageclient/workerFactory';
import type { LanguageClientConfig, WrapperConfig } from 'monaco-editor-wrapper';

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
                    text: '',
                    fileExt: 'js'
                }
            },
            monacoWorkerFactory: configureMonacoWorkers
        }
    };
};

export const createWrapperConfigClassicApp = (): WrapperConfig => {
    return {
        $type: 'classic',
        htmlContainer: createMonacoEditorDiv(),
        vscodeApiConfig: {
            loadThemes: false
        },
        editorAppConfig: {
            codeResources: {
                modified: {
                    text: '',
                    fileExt: 'js'
                }
            },
            monacoWorkerFactory: configureMonacoWorkers
        }
    };
};

export const configureMonacoWorkers = () => {
    useWorkerFactory({
        workerLoaders: {
            TextEditorWorker: () => new Worker(new URL('@codingame/monaco-vscode-editor-api/esm/vs/editor/editor.worker.js', import.meta.url), { type: 'module' }),
        }
    });
};

export const createDefaultLcWorkerConfig = (): LanguageClientConfig => {
    return {
        name: 'test-worker-direct',
        clientOptions: {
            documentSelector: ['javascript']
        },
        connection: {
            options: {
                $type: 'WorkerDirect',
                // create a web worker to pass to the wrapper
                worker: new Worker('./worker/langium-server.ts', {
                    type: 'module',
                    name: 'Langium LS'
                })
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
            }
        }
    };
};
