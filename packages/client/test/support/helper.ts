/* --------------------------------------------------------------------------------------------
 * Copyright (c) 2024 TypeFox and others.
 * Licensed under the MIT License. See LICENSE in the package root for license information.
 * ------------------------------------------------------------------------------------------ */

import { MessageTransports } from 'vscode-languageclient/browser.js';
import type { LanguageClientConfig } from 'monaco-languageclient/lcwrapper';
import type { MonacoVscodeApiConfig } from 'monaco-languageclient/vscodeApiWrapper';

export const createMonacoEditorDiv = () => {
    const div = document.createElement('div');
    div.id = 'monaco-editor-root';
    document.body.insertAdjacentElement('beforeend', div);
    return div;
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

export const createUnreachableWorkerConfig = (): LanguageClientConfig => {
    return {
        name: 'test-worker-unreachable',
        clientOptions: {
            documentSelector: ['javascript']
        },
        connection: {
            options: {
                $type: 'WorkerConfig',
                url: new URL(`${import.meta.url.split('@fs')[0]}/unknown.ts`),
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

export const createDefaultMonacoVscodeApiConfig = (): MonacoVscodeApiConfig => {
    return {
        $type: 'extended',
        advanced: {
            enforceSemanticHighlighting: true
        },
        userConfiguration: {
            json: JSON.stringify({
                'workbench.colorTheme': 'Default Dark Modern'
            })
        },
        htmlContainer: document.body,
        serviceOverrides: {}
    };
};
