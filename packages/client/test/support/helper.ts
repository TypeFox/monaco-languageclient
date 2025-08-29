/* --------------------------------------------------------------------------------------------
 * Copyright (c) 2024 TypeFox and others.
 * Licensed under the MIT License. See LICENSE in the package root for license information.
 * ------------------------------------------------------------------------------------------ */

import type { CodeResources, EditorAppConfig } from 'monaco-languageclient/editorApp';
import type { LanguageClientConfig } from 'monaco-languageclient/lcwrapper';
import type { MonacoVscodeApiConfig } from 'monaco-languageclient/vscodeApiWrapper';
import { configureDefaultWorkerFactory } from 'monaco-languageclient/workerFactory';
import { MessageTransports } from 'vscode-languageclient/browser.js';

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

export const createEditorAppConfigClassic = (codeResources: CodeResources): EditorAppConfig => {
    return {
        $type: 'classic',
        codeResources,
        editorOptions: {},
    };
};

export const createEditorAppConfigClassicExtended = (codeResources: CodeResources): EditorAppConfig => {
    return {
        $type: 'extended',
        codeResources
    };
};

export const createDefaultMonacoVscodeApiConfig = (htmlContainer: HTMLElement): MonacoVscodeApiConfig => {
    return {
        $type: 'extended',
        advanced: {
            enforceSemanticHighlighting: true,
            loadThemes: false
        },
        userConfiguration: {
            json: JSON.stringify({
                'workbench.colorTheme': 'Default Dark Modern'
            })
        },
        htmlContainer,
        monacoWorkerFactory: configureDefaultWorkerFactory
    };
};
