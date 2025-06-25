/* --------------------------------------------------------------------------------------------
 * Copyright (c) 2024 TypeFox and others.
 * Licensed under the MIT License. See LICENSE in the package root for license information.
 * ------------------------------------------------------------------------------------------ */

import getKeybindingsServiceOverride from '@codingame/monaco-vscode-keybindings-service-override';
import { LogLevel } from '@codingame/monaco-vscode-api';
import '../../../../resources/vsix/github-vscode-theme.vsix';
import { MessageTransports } from 'vscode-languageclient';
import type { MonacoVscodeApiConfig } from 'monaco-languageclient/vscodeApiWrapper';
import type { LanguageClientConfig } from 'monaco-languageclient/lcwrapper';
import { configureDefaultWorkerFactory } from 'monaco-languageclient/workerFactory';
import langiumLanguageConfig from './langium.configuration.json?raw';
import langiumTextmateGrammar from './langium.tmLanguage.json?raw';
import text from '../../../../resources/langium/langium-dsl//example.langium?raw';
import type { ExampleAppConfig } from '../../../common/client/utils.js';
import type { EditorAppConfig } from 'monaco-languageclient/editorApp';

export const setupLangiumClientExtended = (params: {
    worker: Worker
    messageTransports?: MessageTransports,
}): ExampleAppConfig => {

    const extensionFilesOrContents = new Map<string, string | URL>();
    // vite build is easier with string content
    extensionFilesOrContents.set('/langium-configuration.json', langiumLanguageConfig);
    extensionFilesOrContents.set('/langium-grammar.json', langiumTextmateGrammar);

    const vscodeApiConfig: MonacoVscodeApiConfig = {
        $type: 'extended',
        logLevel: LogLevel.Debug,
        htmlContainer: document.getElementById('monaco-editor-root')!,
        serviceOverrides: {
            ...getKeybindingsServiceOverride()
        },
        userConfiguration: {
            json: JSON.stringify({
                'workbench.colorTheme': 'GitHub Dark High Contrast',
                'editor.guides.bracketPairsHorizontal': 'active',
                'editor.wordBasedSuggestions': 'off',
                'editor.experimental.asyncTokenization': true,
                'vitest.disableWorkspaceWarning': true
            })
        },
        monacoWorkerFactory: configureDefaultWorkerFactory,
        extensions: [{
            config: {
                name: 'langium-example',
                publisher: 'TypeFox',
                version: '1.0.0',
                engines: {
                    vscode: '*'
                },
                contributes: {
                    languages: [{
                        id: 'langium',
                        extensions: ['.langium'],
                        aliases: ['langium', 'LANGIUM'],
                        configuration: './langium-configuration.json'
                    }],
                    grammars: [{
                        language: 'langium',
                        scopeName: 'source.langium',
                        path: './langium-grammar.json'
                    }]
                }
            },
            filesOrContents: extensionFilesOrContents
        }]
    };

    const languageClientConfig: LanguageClientConfig = {
        clientOptions: {
            documentSelector: ['langium']
        },
        connection: {
            options: {
                $type: 'WorkerDirect',
                worker: params.worker
            },
            messageTransports: params.messageTransports
        }
    };

    const editorAppConfig: EditorAppConfig = {
        $type: vscodeApiConfig.$type,
        codeResources: {
            modified: {
                text,
                uri: '/workspace/grammar.langium'
            }
        }
    };

    return {
        editorAppConfig,
        vscodeApiConfig,
        languageClientConfig
    };
};
