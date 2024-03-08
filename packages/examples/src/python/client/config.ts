/* --------------------------------------------------------------------------------------------
 * Copyright (c) 2024 TypeFox GmbH (http://www.typefox.io). All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 * ------------------------------------------------------------------------------------------ */

import * as vscode from 'vscode';
import getKeybindingsServiceOverride from '@codingame/monaco-vscode-keybindings-service-override';
import '@codingame/monaco-vscode-python-default-extension';
import { UserConfig } from 'monaco-editor-wrapper';
import { MonacoLanguageClient } from 'monaco-languageclient';

export const createUserConfig = (code: string): UserConfig => {
    return {
        languageClientConfig: {
            options: {
                name: 'Python Language Server Example',
                $type: 'WebSocket',
                host: 'localhost',
                port: 30001,
                path: 'pyright',
                extraParams: {
                    authorization: 'UserAuth'
                },
                secured: false,
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
                    uri: vscode.Uri.parse('/workspace/')
                },
            },
        },
        wrapperConfig: {
            serviceConfig: {
                userServices: {
                    ...getKeybindingsServiceOverride()
                },
                debugLogging: true
            },
            editorAppConfig: {
                $type: 'extended',
                languageId: 'python',
                codeUri: '/workspace/python.py',
                extensions: [{
                    config: {
                        name: 'python-client',
                        publisher: 'monaco-languageclient-project',
                        version: '1.0.0',
                        engines: {
                            vscode: '^1.85.0'
                        },
                        contributes: {
                            languages: [{
                                id: 'python',
                                extensions: ['.py', 'pyi'],
                                aliases: ['python'],
                                mimetypes: ['application/python'],
                            }],
                        }
                    }
                }],
                userConfiguration: {
                    json: JSON.stringify({
                        'workbench.colorTheme': 'Default Dark Modern'
                    })
                },
                useDiffEditor: false,
                code
            }
        }
    };
};
