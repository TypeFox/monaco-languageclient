/* --------------------------------------------------------------------------------------------
 * Copyright (c) 2024 TypeFox and others.
 * Licensed under the MIT License. See LICENSE in the package root for license information.
 * ------------------------------------------------------------------------------------------ */

import * as vscode from 'vscode';
import getEditorServiceOverride from '@codingame/monaco-vscode-editor-service-override';
import getKeybindingsServiceOverride from '@codingame/monaco-vscode-keybindings-service-override';
import '@codingame/monaco-vscode-python-default-extension';
import { createUrl, UserConfig } from 'monaco-editor-wrapper';
import { useOpenEditorStub } from 'monaco-editor-wrapper/vscode/services';
import { MonacoLanguageClient } from 'monaco-languageclient';
import { toSocket, WebSocketMessageReader, WebSocketMessageWriter } from 'vscode-ws-jsonrpc';

export const createUserConfig = (workspaceRoot: string, code: string, codeUri: string): UserConfig => {
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
                clientOptions: {
                    documentSelector: ['python'],
                    workspaceFolder: {
                        index: 0,
                        name: 'workspace',
                        uri: vscode.Uri.parse(workspaceRoot)
                    },
                },
                connectionProvider: {
                    get: async () => ({ reader, writer })
                }
            }
        },
        wrapperConfig: {
            serviceConfig: {
                userServices: {
                    ...getEditorServiceOverride(useOpenEditorStub),
                    ...getKeybindingsServiceOverride()
                },
                debugLogging: true
            },
            editorAppConfig: {
                $type: 'extended',
                codeResources: {
                    main: {
                        text: code,
                        uri: codeUri
                    }
                },
                userConfiguration: {
                    json: JSON.stringify({
                        'workbench.colorTheme': 'Default Dark Modern',
                        'editor.guides.bracketPairsHorizontal': 'active',
                        'editor.wordBasedSuggestions': 'off'
                    })
                },
                useDiffEditor: false
            }
        },
        loggerConfig: {
            enabled: true,
            debugEnabled: true
        }
    };
};
