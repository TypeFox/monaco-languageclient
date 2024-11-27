/* --------------------------------------------------------------------------------------------
 * Copyright (c) 2024 TypeFox and others.
 * Licensed under the MIT License. See LICENSE in the package root for license information.
 * ------------------------------------------------------------------------------------------ */

import { LogLevel } from 'vscode';
import getConfigurationServiceOverride from '@codingame/monaco-vscode-configuration-service-override';
import getKeybindingsServiceOverride from '@codingame/monaco-vscode-keybindings-service-override';
import '@codingame/monaco-vscode-groovy-default-extension';
import { WrapperConfig } from 'monaco-editor-wrapper';
import { configureMonacoWorkers } from 'monaco-languageclient-examples';

export const getGroovyClientConfig: () => WrapperConfig = () => {
    return {
        $type: 'extended',
        logLevel: LogLevel.Debug,
        vscodeApiConfig: {
            serviceOverrides: {
                ...getConfigurationServiceOverride(),
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
            codeResources: {
                main: {
                    text: 'System.out.println("Hello, World!");',
                    fileExt: 'groovy'
                },
            },
            useDiffEditor: false,
            monacoWorkerFactory: configureMonacoWorkers,
        },
        languageClientConfigs: {
            groovy: {
                clientOptions: {
                    documentSelector: ['groovy'],
                },
                connection: {
                    options: {
                        $type: 'WebSocketUrl',
                        url: 'ws://localhost:30002/groovy',
                    },
                },
            },
        },
    };
};
