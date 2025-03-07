/* --------------------------------------------------------------------------------------------
 * Copyright (c) 2024 TypeFox and others.
 * Licensed under the MIT License. See LICENSE in the package root for license information.
 * ------------------------------------------------------------------------------------------ */

import getKeybindingsServiceOverride from '@codingame/monaco-vscode-keybindings-service-override';
// this is required syntax highlighting
import '@codingame/monaco-vscode-groovy-default-extension';
import { LogLevel } from '@codingame/monaco-vscode-api';
import { MonacoEditorLanguageClientWrapper, type WrapperConfig } from 'monaco-editor-wrapper';
import { configureDefaultWorkerFactory } from 'monaco-editor-wrapper/workers/workerLoaders';
import { groovyConfig } from '../config.js';

const code = `package test.org;
import java.io.File;
File file = new File("E:/Example.txt");
`;

const wrapperConfig: WrapperConfig = {
    $type: 'extended',
    htmlContainer: document.getElementById('monaco-editor-root')!,
    logLevel: LogLevel.Debug,
    vscodeApiConfig: {
        serviceOverrides: {
            ...getKeybindingsServiceOverride(),
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
        codeResources: {
            modified: {
                text: code,
                uri: '/workspace/test.groovy'
            }
        },
        monacoWorkerFactory: configureDefaultWorkerFactory
    },
    languageClientConfigs: {
        configs: {
            groovy: {
                clientOptions: {
                    documentSelector: ['groovy']
                },
                connection: {
                    options: {
                        $type: 'WebSocketUrl',
                        url: `ws://localhost:${groovyConfig.port}${groovyConfig.path}`
                    }
                }
            }
        }
    }
};

export const runGroovyClient = () => {
    const wrapper = new MonacoEditorLanguageClientWrapper();

    try {
        document.querySelector('#button-start')?.addEventListener('click', async () => {
            await wrapper.initAndStart(wrapperConfig);
        });
        document.querySelector('#button-dispose')?.addEventListener('click', async () => {
            await wrapper.dispose();
        });
    } catch (e) {
        console.error(e);
    }
};
