/* --------------------------------------------------------------------------------------------
 * Copyright (c) 2024 TypeFox and others.
 * Licensed under the MIT License. See LICENSE in the package root for license information.
 * ------------------------------------------------------------------------------------------ */

import * as vscode from 'vscode';
import getConfigurationServiceOverride from '@codingame/monaco-vscode-configuration-service-override';
import getTextmateServiceOverride from '@codingame/monaco-vscode-textmate-service-override';
import getThemeServiceOverride from '@codingame/monaco-vscode-theme-service-override';
import '@codingame/monaco-vscode-theme-defaults-default-extension';
// this is required syntax highlighting
import '@codingame/monaco-vscode-cpp-default-extension';
import { LogLevel } from 'vscode/services';
import { WrapperConfig } from 'monaco-editor-wrapper';
import { FILE_PATH, LANGUAGE_ID, WORKSPACE_PATH } from '../definitions.js';
import { createServer } from '../worker/server.js';
import { configureMonacoWorkers } from '../../common/client/utils.js';

export const createUserConfig = async (code: string): Promise<WrapperConfig> => {
    return {
        logLevel: LogLevel.Debug,
        languageClientConfigs: {
            LANGUAGE_ID: {
                languageId: LANGUAGE_ID,
                name: 'Clangd WASM Language Server',
                connection: {
                    options: {
                        $type: 'WorkerDirect',
                        worker: await createServer(),
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
        serviceConfig: {
            workspaceConfig: {
                workspaceProvider: {
                    trusted: true,
                    workspace: {
                        workspaceUri: vscode.Uri.file(WORKSPACE_PATH),
                    },
                    async open(p) {
                        console.log(`Editor open request: ${p}`);
                        return false;
                    },
                },
            },
            userServices: {
                ...getConfigurationServiceOverride(),
                ...getTextmateServiceOverride(),
                ...getThemeServiceOverride(),
            }
        },
        editorAppConfig: {
            $type: 'extended',
            codeResources: {
                main: {
                    text: code,
                    uri: FILE_PATH,
                },
            },
            userConfiguration: {
                json: getUserConfigurationJson(),
            },
            useDiffEditor: false,
            monacoWorkerFactory: configureMonacoWorkers
        }
    };
};

const getUserConfigurationJson = () => {
    return JSON.stringify({
        'workbench.colorTheme': 'Default Dark Modern',
        'editor.wordBasedSuggestions': 'off',
        'editor.inlayHints.enabled': 'offUnlessPressed',
        'editor.quickSuggestionsDelay': 200,
    });
};
