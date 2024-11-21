/* --------------------------------------------------------------------------------------------
 * Copyright (c) 2024 TypeFox and others.
 * Licensed under the MIT License. See LICENSE in the package root for license information.
 * ------------------------------------------------------------------------------------------ */

import getKeybindingsServiceOverride from '@codingame/monaco-vscode-keybindings-service-override';
import '../../../../resources/vsix/github-vscode-theme.vsix';

import { BrowserMessageReader, BrowserMessageWriter } from 'vscode-languageclient/browser.js';
import { LogLevel } from 'vscode/services';
import { WrapperConfig } from 'monaco-editor-wrapper';
import { loadLangiumWorker } from '../wrapperLangium.js';
import { configureMonacoWorkers } from '../../../common/client/utils.js';
import langiumLanguageConfig from './langium.configuration.json?raw';
import langiumTextmateGrammar from './langium.tmLanguage.json?raw';
import text from '../../../../resources/langium/langium-dsl//example.langium?raw';

export const setupLangiumClientExtended = async (): Promise<WrapperConfig> => {

    const extensionFilesOrContents = new Map<string, string | URL>();
    // vite build is easier with string content
    extensionFilesOrContents.set('/langium-configuration.json', langiumLanguageConfig);
    extensionFilesOrContents.set('/langium-grammar.json', langiumTextmateGrammar);

    const langiumWorker = loadLangiumWorker();
    const reader = new BrowserMessageReader(langiumWorker);
    const writer = new BrowserMessageWriter(langiumWorker);

    return {
        $type: 'extended',
        htmlContainer: document.getElementById('monaco-editor-root')!,
        logLevel: LogLevel.Debug,
        vscodeApiConfig: {
            serviceOverrides: {
                ...getKeybindingsServiceOverride()
            },
            userConfiguration: {
                json: JSON.stringify({
                    'workbench.colorTheme': 'GitHub Dark High Contrast',
                    'editor.guides.bracketPairsHorizontal': 'active',
                    'editor.wordBasedSuggestions': 'off',
                    'editor.experimental.asyncTokenization': true
                })
            }
        },
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
        }],
        editorAppConfig: {
            codeResources: {
                main: {
                    text,
                    fileExt: 'langium'
                }
            },
            monacoWorkerFactory: configureMonacoWorkers
        },
        languageClientConfigs: {
            langium: {
                clientOptions: {
                    documentSelector: ['langium']
                },
                connection: {
                    options: {
                        $type: 'WorkerDirect',
                        worker: langiumWorker
                    },
                    messageTransports: { reader, writer }
                }
            }
        }
    };
};
