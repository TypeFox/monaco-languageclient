/* --------------------------------------------------------------------------------------------
 * Copyright (c) 2024 TypeFox and others.
 * Licensed under the MIT License. See LICENSE in the package root for license information.
 * ------------------------------------------------------------------------------------------ */

import getKeybindingsServiceOverride from '@codingame/monaco-vscode-keybindings-service-override';
// this is required syntax highlighting
import '@codingame/monaco-vscode-json-default-extension';
import { MonacoEditorLanguageClientWrapper, WrapperConfig } from 'monaco-editor-wrapper';

const text = `{
    "$schema": "http://json.schemastore.org/coffeelint",
    "line_endings": {"value": "unix"}
}`;

export const jsonClientUserConfig: WrapperConfig = {
    serviceConfig: {
        userServices: {
            ...getKeybindingsServiceOverride(),
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
                'editor.guides.bracketPairsHorizontal': 'active',
                'editor.lightbulb.enabled': 'On',
                'editor.wordBasedSuggestions': 'off'
            })
        }
    },
    languageClientConfigs: {
        json: {
            languageId: 'json',
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

export const runJsonWrapper = () => {
    const wrapper = new MonacoEditorLanguageClientWrapper();
    const htmlElement = document.getElementById('monaco-editor-root');

    try {
        document.querySelector('#button-start')?.addEventListener('click', async () => {
            await wrapper.initAndStart(jsonClientUserConfig, htmlElement);
        });
        document.querySelector('#button-dispose')?.addEventListener('click', async () => {
            await wrapper.dispose();
        });
    } catch (e) {
        console.error(e);
    }
};
