/* --------------------------------------------------------------------------------------------
 * Copyright (c) 2024 TypeFox and others.
 * Licensed under the MIT License. See LICENSE in the package root for license information.
 * ------------------------------------------------------------------------------------------ */

import getEditorServiceOverride from '@codingame/monaco-vscode-editor-service-override';
import getKeybindingsServiceOverride from '@codingame/monaco-vscode-keybindings-service-override';
import '../../../../resources/vsix/github-vscode-theme.vsix';
import { useOpenEditorStub } from 'monaco-editor-wrapper/vscode/services';
import { BrowserMessageReader, BrowserMessageWriter } from 'vscode-languageclient/browser.js';
import { LogLevel } from 'vscode/services';
import { WrapperConfig } from 'monaco-editor-wrapper';
import { loadLangiumWorker } from '../wrapperLangium.js';
import { configureMonacoWorkers } from '../../../common/client/utils.js';
import langiumLanguageConfig from './langium.configuration.json?raw';
import langiumTextmateGrammar from './langium.tmLanguage.json?raw';
import text from '../content/example.langium?raw';

export const setupLangiumClientExtended = async (): Promise<WrapperConfig> => {

    const extensionFilesOrContents = new Map<string, string | URL>();
    // vite build is easier with string content
    extensionFilesOrContents.set('/langium-configuration.json', langiumLanguageConfig);
    extensionFilesOrContents.set('/langium-grammar.json', langiumTextmateGrammar);

    const langiumWorker = loadLangiumWorker();
    const reader = new BrowserMessageReader(langiumWorker);
    const writer = new BrowserMessageWriter(langiumWorker);

    return {
        logLevel: LogLevel.Debug,
        serviceConfig: {
            userServices: {
                ...getEditorServiceOverride(useOpenEditorStub),
                ...getKeybindingsServiceOverride()
            }
        },
        editorAppConfig: {
            $type: 'extended',
            codeResources: {
                main: {
                    text,
                    fileExt: 'langium'
                }
            },
            useDiffEditor: false,
            extensions: [{
                config: {
                    name: 'langium-example',
                    publisher: 'monaco-editor-wrapper-examples',
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
            userConfiguration: {
                json: JSON.stringify({
                    'workbench.colorTheme': 'GitHub Dark High Contrast',
                    'editor.guides.bracketPairsHorizontal': 'active',
                    'editor.wordBasedSuggestions': 'off',
                    'editor.experimental.asyncTokenization': true
                })
            },
            monacoWorkerFactory: configureMonacoWorkers,
            htmlContainer: document.getElementById('monaco-editor-root')!
        },
        languageClientConfigs: {
            langium: {
                languageId: 'langium',
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
