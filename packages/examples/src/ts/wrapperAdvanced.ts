/* --------------------------------------------------------------------------------------------
 * Copyright (c) 2024 TypeFox and others.
 * Licensed under the MIT License. See LICENSE in the package root for license information.
 * ------------------------------------------------------------------------------------------ */

import * as vscode from 'vscode';
import getKeybindingsServiceOverride from '@codingame/monaco-vscode-keybindings-service-override';
// this is required syntax highlighting
import '@codingame/monaco-vscode-json-default-extension';
import '@codingame/monaco-vscode-python-default-extension';
import { MonacoEditorLanguageClientWrapper, UserConfig } from 'monaco-editor-wrapper';
import { useWorkerFactory } from 'monaco-editor-wrapper/workerFactory';
import { MonacoLanguageClient } from 'monaco-languageclient';

export const configureMonacoWorkers = () => {
    useWorkerFactory({
        ignoreMapping: true,
        workerLoaders: {
            editorWorkerService: () => new Worker(new URL('monaco-editor/esm/vs/editor/editor.worker.js', import.meta.url), { type: 'module' })
        }
    });
};

export const runMultipleLanguageClientsExample = async () => {
    const text = `{
    "$schema": "http://json.schemastore.org/coffeelint",
    "line_endings": {"value": "unix"}
}`;
    const userConfig: UserConfig = {
        id: '42',
        wrapperConfig: {
            serviceConfig: {
                userServices: {
                    ...getKeybindingsServiceOverride()
                },
                debugLogging: true
            },
            editorAppConfig: {
                $type: 'extended',
                codeResources: {
                    main: {
                        text,
                        fileExt: 'json'
                    }
                },
                useDiffEditor: false,
                userConfiguration: {
                    json: JSON.stringify({
                        'workbench.colorTheme': 'Default Dark Modern',
                        'editor.wordBasedSuggestions': 'off'
                    })
                }
            }
        },
        languageClientConfigs: {
            json: {
                languageId: 'json',
                name: 'JSON Client',
                connection: {
                    configOptions: {
                        $type: 'WebSocketParams',
                        host: 'localhost',
                        port: 30000,
                        path: 'sampleServer',
                        secured: false
                    }
                }
            },
            python: {
                languageId: 'python',
                name: 'Python Client',
                connection: {
                    configOptions: {
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
                                            languageClient?.sendRequest('workspace/executeCommand', { command: cmdName, arguments: args });
                                        });
                                    });
                                }, 250);
                            },
                            reportStatus: true,
                        }
                    }
                },
                languageClientOptions: {
                    documentSelector: ['python'],
                    workspaceFolder: {
                        index: 0,
                        name: 'workspace',
                        uri: vscode.Uri.parse('/workspace')
                    }
                }
            }
        }
    };

    const htmlElement = document.getElementById('monaco-editor-root');
    const wrapper = new MonacoEditorLanguageClientWrapper();

    try {
        document.querySelector('#button-start')?.addEventListener('click', async () => {
            await wrapper.initAndStart(userConfig, htmlElement);
        });
        document.querySelector('#button-dispose')?.addEventListener('click', async () => {
            await wrapper.dispose();
        });
    } catch (e) {
        console.error(e);
    }
};
