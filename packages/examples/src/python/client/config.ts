/* --------------------------------------------------------------------------------------------
 * Copyright (c) 2024 TypeFox and others.
 * Licensed under the MIT License. See LICENSE in the package root for license information.
 * ------------------------------------------------------------------------------------------ */

import * as vscode from 'vscode';
import getKeybindingsServiceOverride from '@codingame/monaco-vscode-keybindings-service-override';
import '@codingame/monaco-vscode-python-default-extension';
import { LogLevel } from 'vscode/services';
import { MonacoLanguageClient } from 'monaco-languageclient';
import { createUrl } from 'monaco-languageclient/tools';
import { WrapperConfig } from 'monaco-editor-wrapper';
import { toSocket, WebSocketMessageReader, WebSocketMessageWriter } from 'vscode-ws-jsonrpc';
import { configureMonacoWorkers } from '../../common/client/utils.js';

export const createUserConfig = (workspaceRoot: string, code: string, codeUri: string): WrapperConfig => {
    const url = createUrl({
        secured: false,
        host: 'localhost',
        port: 30001,
        path: 'pyright',
        extraParams: {
            authorization: 'UserAuth'
        }
    });
    const webSocket = new WebSocket(url);
    const iWebSocket = toSocket(webSocket);
    const reader = new WebSocketMessageReader(iWebSocket);
    const writer = new WebSocketMessageWriter(iWebSocket);

    return {
        languageClientConfigs: {
            python: {
                languageId: 'python',
                name: 'Python Language Server Example',
                connection: {
                    options: {
                        $type: 'WebSocketDirect',
                        webSocket: webSocket,
                        startOptions: {
                            onCall: (languageClient?: MonacoLanguageClient) => {
                                setTimeout(() => {
                                    ['pyright.restartserver', 'pyright.organizeimports'].forEach((cmdName) => {
                                        vscode.commands.registerCommand(cmdName, (...args: unknown[]) => {
                                            languageClient?.sendRequest('workspace/executeCommand', { command: cmdName, arguments: args });
                                        });
                                    });
                                }, 250);
                            },
                            reportStatus: true,
                        }
                    },
                    messageTransports: { reader, writer }
                },
                clientOptions: {
                    documentSelector: ['python'],
                    workspaceFolder: {
                        index: 0,
                        name: 'workspace',
                        uri: vscode.Uri.parse(workspaceRoot)
                    },
                }
            }
        },
        logLevel: LogLevel.Debug,
        vscodeApiConfig: {
            userServices: {
                ...getKeybindingsServiceOverride()
            },
            userConfiguration: {
                json: JSON.stringify({
                    'workbench.colorTheme': 'Default Dark Modern',
                    'editor.guides.bracketPairsHorizontal': 'active',
                    'editor.wordBasedSuggestions': 'off',
                    'editor.experimental.asyncTokenization': true
                })
            }
        },
        editorAppConfig: {
            $type: 'extended',
            codeResources: {
                main: {
                    text: code,
                    uri: codeUri
                }
            },
            useDiffEditor: false,
            monacoWorkerFactory: configureMonacoWorkers,
            htmlContainer: document.getElementById('monaco-editor-root')!
        }
    };
};
