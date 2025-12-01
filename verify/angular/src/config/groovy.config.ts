/* --------------------------------------------------------------------------------------------
 * Copyright (c) 2024 TypeFox and others.
 * Licensed under the MIT License. See LICENSE in the package root for license information.
 * ------------------------------------------------------------------------------------------ */

import { LogLevel } from 'vscode';
import getKeybindingsServiceOverride from '@codingame/monaco-vscode-keybindings-service-override';
import { WrapperConfig } from 'monaco-editor-wrapper';
import { configureMonacoWorkers } from 'monaco-languageclient-examples';
export function getGroovyClientConfig(htmlContainerId: string) {
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
                    'editor.experimental.asyncTokenization': true,
                }),
            },
        },
        editorAppConfig: {
            $type: 'extended',
            codeResources: {
                main: {
                    text: '',
                    fileExt: 'groovy',
                },
            },
            useDiffEditor: false,
            monacoWorkerFactory: configureMonacoWorkers,
            htmlContainer: document.getElementById(htmlContainerId)!,
        },
        languageClientConfigs: {
            groovy: {
                languageId: 'groovy',
                connection: {
                    options: {
                        $type: 'WebSocketUrl',
                        url: 'ws://localhost:30002/groovy',
                    },
                },
            },
        },
    };
    return userConfig;
}
