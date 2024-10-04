/* --------------------------------------------------------------------------------------------
 * Copyright (c) 2024 TypeFox and others.
 * Licensed under the MIT License. See LICENSE in the package root for license information.
 * ------------------------------------------------------------------------------------------ */

import * as vscode from 'vscode';
import getKeybindingsServiceOverride from '@codingame/monaco-vscode-keybindings-service-override';
// this is required syntax highlighting
import '@codingame/monaco-vscode-json-default-extension';
import '@codingame/monaco-vscode-python-default-extension';
import { LogLevel } from 'vscode/services';
import { CodePlusFileExt, MonacoEditorLanguageClientWrapper, WrapperConfig } from 'monaco-editor-wrapper';
import { MonacoLanguageClient } from 'monaco-languageclient';
import { configureMonacoWorkers, disableButton } from '../common/client/utils.js';

export const runMultipleLanguageClientsExample = async () => {
    disableButton('button-flip', true);

    const textJson = `{
    "$schema": "http://json.schemastore.org/coffeelint",
    "line_endings": {"value": "unix"}
}`;

    const textPython = `from hello2 import print_hello

print_hello()
print("Hello Moon!")
`;

    let currentText = textJson;
    let currenFileExt = 'json';

    const wrapperConfig: WrapperConfig = {
        id: '42',
        logLevel: LogLevel.Debug,
        serviceConfig: {
            userServices: {
                ...getKeybindingsServiceOverride()
            }
        },
        editorAppConfig: {
            $type: 'extended',
            codeResources: {
                main: {
                    text: currentText,
                    fileExt: currenFileExt
                }
            },
            useDiffEditor: false,
            userConfiguration: {
                json: JSON.stringify({
                    'workbench.colorTheme': 'Default Dark Modern',
                    'editor.wordBasedSuggestions': 'off',
                    'editor.experimental.asyncTokenization': true
                })
            },
            monacoWorkerFactory: configureMonacoWorkers,
            htmlContainer: document.getElementById('monaco-editor-root')!
        },
        languageClientConfigs: {
            json: {
                languageId: 'json',
                name: 'JSON Client',
                connection: {
                    options: {
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
                                            languageClient?.sendRequest('workspace/executeCommand', { command: cmdName, arguments: args });
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
            }
        }
    };

    const wrapper = new MonacoEditorLanguageClientWrapper();

    try {
        document.querySelector('#button-start')?.addEventListener('click', async () => {
            if (wrapperConfig.editorAppConfig.codeResources?.main !== undefined) {
                (wrapperConfig.editorAppConfig.codeResources.main as CodePlusFileExt).text = currentText;
                (wrapperConfig.editorAppConfig.codeResources.main as CodePlusFileExt).fileExt = currenFileExt;
            }

            await wrapper.initAndStart(wrapperConfig);
            disableButton('button-flip', false);
        });
        document.querySelector('#button-dispose')?.addEventListener('click', async () => {
            await wrapper.dispose();
            disableButton('button-flip', true);
        });
        document.querySelector('#button-flip')?.addEventListener('click', async () => {
            currentText = currentText === textJson ? textPython : textJson;
            currenFileExt = currenFileExt === 'json' ? 'py' : 'json';
            wrapper.updateCodeResources({
                main: {
                    text: currentText,
                    fileExt: currenFileExt
                }
            });
        });
    } catch (e) {
        console.error(e);
    }
};
