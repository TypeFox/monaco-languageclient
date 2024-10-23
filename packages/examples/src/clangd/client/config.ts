/* --------------------------------------------------------------------------------------------
 * Copyright (c) 2024 TypeFox and others.
 * Licensed under the MIT License. See LICENSE in the package root for license information.
 * ------------------------------------------------------------------------------------------ */

import * as vscode from 'vscode';
import getConfigurationServiceOverride from '@codingame/monaco-vscode-configuration-service-override';
import { LogLevel } from 'vscode/services';
import { WrapperConfig } from 'monaco-editor-wrapper';
import { LANGUAGE_ID, WORKSPACE_PATH } from '../definitions.js';
import { configureMonacoWorkers } from '../../common/client/utils.js';
import { ClangdWorkerHandler } from './workerHandler.js';
import { openNewEditor } from './main.js';

export const createUserConfig = async (config: {
    htmlContainer: HTMLElement,
    clangdWorkerHandler: ClangdWorkerHandler,
    lsMessageLocalPort: MessagePort
}): Promise<WrapperConfig> => {
    return {
        logLevel: LogLevel.Debug,
        languageClientConfigs: {
            LANGUAGE_ID: {
                languageId: LANGUAGE_ID,
                name: 'Clangd WASM Language Server',
                connection: {
                    options: {
                        $type: 'WorkerDirect',
                        worker: await config.clangdWorkerHandler.createWorker(),
                        messagePort: config.lsMessageLocalPort
                    }
                },
                restartOptions: {
                    retries: 5,
                    timeout: 1000,
                    keepWorker: true
                },
                clientOptions: {
                    documentSelector: [LANGUAGE_ID],
                    workspaceFolder: {
                        index: 0,
                        name: 'workspace',
                        uri: vscode.Uri.file(WORKSPACE_PATH),
                    }
                }
            }
        },
        vscodeApiConfig: {
            workspaceConfig: {
                workspaceProvider: {
                    trusted: true,
                    workspace: {
                        workspaceUri: vscode.Uri.file(`${WORKSPACE_PATH}/workspace.code-workspace`)
                    },
                    async open() {
                        window.open(window.location.href);
                        return true;
                    }
                },
            },
            viewsConfig: {
                viewServiceType: 'EditorService',
                openEditorFunc: openNewEditor
            },
            userServices: {
                ...getConfigurationServiceOverride(),
            },
            userConfiguration: {
                json: JSON.stringify({
                    'workbench.colorTheme': 'Default Dark Modern',
                    'editor.wordBasedSuggestions': 'off',
                    'editor.inlayHints.enabled': 'offUnlessPressed',
                    'editor.quickSuggestionsDelay': 200,
                    'editor.experimental.asyncTokenization': false
                })
            }
        },
        editorAppConfig: {
            $type: 'extended',
            useDiffEditor: false,
            monacoWorkerFactory: configureMonacoWorkers,
            htmlContainer: config.htmlContainer
        }
    };
};
