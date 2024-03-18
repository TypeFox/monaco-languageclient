/* --------------------------------------------------------------------------------------------
 * Copyright (c) 2024 TypeFox GmbH (http://www.typefox.io). All rights reserved.
 * Licensed under the MIT License. See LICENSE in the package root for license information.
 * ------------------------------------------------------------------------------------------ */

import getEditorServiceOverride from '@codingame/monaco-vscode-editor-service-override';
import getKeybindingsServiceOverride from '@codingame/monaco-vscode-keybindings-service-override';
import { useOpenEditorStub } from 'monaco-editor-wrapper/vscode/services';
import { UserConfig } from 'monaco-editor-wrapper';
import { getTextContent } from '../../../common/example-apps-common.js';
import { loadLangiumWorker } from '../wrapperLangium.js';

export const setupLangiumClientExtended = async (): Promise<UserConfig> => {
    const code = await getTextContent(new URL('./src/langium/langium-dsl/content/example.langium', window.location.href));

    const extensionFilesOrContents = new Map<string, string | URL>();
    const langiumLanguageConfig = new URL('./src/langium/langium-dsl/config/langium.configuration.json', window.location.href);
    const langiumTextmateGrammar = await getTextContent(new URL('./src/langium/langium-dsl/config/langium.tmLanguage.json', window.location.href));
    // test both url and string content
    extensionFilesOrContents.set('/langium-configuration.json', langiumLanguageConfig);
    extensionFilesOrContents.set('/langium-grammar.json', langiumTextmateGrammar);

    const langiumWorker = loadLangiumWorker();
    return {
        wrapperConfig: {
            serviceConfig: {
                userServices: {
                    ...getEditorServiceOverride(useOpenEditorStub),
                    ...getKeybindingsServiceOverride()
                },
                debugLogging: true
            },
            editorAppConfig: {
                $type: 'extended',
                languageId: 'langium',
                code: code,
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
                        'workbench.colorTheme': 'Default Dark Modern',
                        'editor.guides.bracketPairsHorizontal': 'active',
                        'editor.wordBasedSuggestions': 'off'
                    })
                }
            }
        },
        languageClientConfig: {
            options: {
                $type: 'WorkerDirect',
                worker: langiumWorker
            }
        }
    };
};
