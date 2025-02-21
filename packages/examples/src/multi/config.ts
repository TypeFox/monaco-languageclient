/* --------------------------------------------------------------------------------------------
 * Copyright (c) 2024 TypeFox and others.
 * Licensed under the MIT License. See LICENSE in the package root for license information.
 * ------------------------------------------------------------------------------------------ */

import * as vscode from 'vscode';
import { MonacoLanguageClient } from 'monaco-languageclient';
import type { LanguageClientConfig } from 'monaco-editor-wrapper';

export const createJsonLanguageClientConfig: () => LanguageClientConfig = () => {
    return {
        name: 'JSON Client',
        clientOptions: {
            documentSelector: ['json']
        },
        connection: {
            options: {
                $type: 'WebSocketParams',
                host: 'localhost',
                port: 30000,
                path: 'sampleServer',
                secured: false
            }
        }
    };
};

export const createPythonLanguageClientConfig: () => LanguageClientConfig = () => {
    return {
        connection: {
            options: {
                $type: 'WebSocketParams',
                host: 'localhost',
                port: 30001,
                path: 'pyright',
                secured: false,
                extraParams: {
                    authorization: 'UserAuth'
                },
                startOptions: {
                    onCall: (languageClient?: MonacoLanguageClient) => {
                        setTimeout(() => {
                            ['pyright.restartserver', 'pyright.organizeimports'].forEach((cmdName) => {
                                vscode.commands.registerCommand(cmdName, (...args: unknown[]) => {
                                    void languageClient?.sendRequest('workspace/executeCommand', { command: cmdName, arguments: args });
                                });
                            });
                        }, 250);
                    },
                    reportStatus: true,
                }
            }
        },
        clientOptions: {
            documentSelector: ['python', 'py'],
            workspaceFolder: {
                index: 0,
                name: 'workspace',
                uri: vscode.Uri.parse('/workspace')
            }
        }
    };
};
