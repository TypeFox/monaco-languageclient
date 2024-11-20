/* --------------------------------------------------------------------------------------------
 * Copyright (c) 2024 TypeFox and others.
 * Licensed under the MIT License. See LICENSE in the package root for license information.
 * ------------------------------------------------------------------------------------------ */

import getKeybindingsServiceOverride from '@codingame/monaco-vscode-keybindings-service-override';
// this is required syntax highlighting
import '@codingame/monaco-vscode-json-default-extension';
import { LogLevel } from 'vscode/services';
import { MonacoEditorLanguageClientWrapper, WrapperConfig } from 'monaco-editor-wrapper';
import { configureMonacoWorkers } from '../../common/client/utils.js';

const text = `{
    "$schema": "http://json.schemastore.org/coffeelint",
    "line_endings": {"value": "unix"}
}`;

export const buildJsonClientUserConfig = (params: {
    htmlContainer: HTMLElement
}): WrapperConfig => {
    return {
        $type: 'extended',
        htmlContainer: params.htmlContainer,
        logLevel: LogLevel.Debug,
        vscodeApiConfig: {
            serviceOverrides: {
                ...getKeybindingsServiceOverride(),
            },
            userConfiguration: {
                json: JSON.stringify({
                    'workbench.colorTheme': 'Default Dark Modern',
                    'editor.guides.bracketPairsHorizontal': 'active',
                    'editor.lightbulb.enabled': 'On',
                    'editor.wordBasedSuggestions': 'off',
                    'editor.experimental.asyncTokenization': true
                })
            }
        },
        editorAppConfig: {
            codeResources: {
                main: {
                    text,
                    fileExt: 'json'
                }
            },
            monacoWorkerFactory: configureMonacoWorkers
        },
        languageClientConfigs: {
            json: {
                clientOptions: {
                    documentSelector: ['json']
                },
                connection: {
                    options: {
                        $type: 'WebSocketUrl',
                        url: 'ws://localhost:30000/sampleServer',
                        startOptions: {
                            onCall: () => {
                                console.log('Connected to socket.');
                            },
                            reportStatus: true
                        },
                        stopOptions: {
                            onCall: () => {
                                console.log('Disconnected from socket.');
                            },
                            reportStatus: true
                        }
                    }
                }
            }
        }
    };
};

export const runJsonWrapper = () => {
    const wrapper = new MonacoEditorLanguageClientWrapper();

    try {
        document.querySelector('#button-start')?.addEventListener('click', async () => {
            const config = buildJsonClientUserConfig({
                htmlContainer: document.getElementById('monaco-editor-root')!
            });
            await wrapper.initAndStart(config);
        });
        document.querySelector('#button-dispose')?.addEventListener('click', async () => {
            await wrapper.dispose();
        });
    } catch (e) {
        console.error(e);
    }
};
