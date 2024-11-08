/* --------------------------------------------------------------------------------------------
 * Copyright (c) 2024 TypeFox and others.
 * Licensed under the MIT License. See LICENSE in the package root for license information.
 * ------------------------------------------------------------------------------------------ */

import getKeybindingsServiceOverride from '@codingame/monaco-vscode-keybindings-service-override';
// this is required syntax highlighting
import '@codingame/monaco-vscode-groovy-default-extension';
import { LogLevel } from 'vscode/services';
import { MonacoEditorLanguageClientWrapper, WrapperConfig } from 'monaco-editor-wrapper';
import { groovyConfig } from '../config.js';
import { configureMonacoWorkers } from '../../common/client/utils.js';

const code = `package test.org;
import java.io.File;
File file = new File("E:/Example.txt");
`;

const userConfig: WrapperConfig = {
    logLevel: LogLevel.Debug,
    vscodeApiConfig: {
        userServices: {
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
        $type: 'extended',
        codeResources: {
            main: {
                text: code,
                fileExt: 'groovy'
            }
        },
        useDiffEditor: false,
        monacoWorkerFactory: configureMonacoWorkers,
        htmlContainer: document.getElementById('monaco-editor-root')!
    },
    languageClientConfigs: {
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
};

export const runGroovyClient = () => {
    const wrapper = new MonacoEditorLanguageClientWrapper();

    try {
        document.querySelector('#button-start')?.addEventListener('click', async () => {
            await wrapper.initAndStart(userConfig);
        });
        document.querySelector('#button-dispose')?.addEventListener('click', async () => {
            await wrapper.dispose();
        });
    } catch (e) {
        console.error(e);
    }
};
