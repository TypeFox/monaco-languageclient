/* --------------------------------------------------------------------------------------------
 * Copyright (c) 2024 TypeFox and others.
 * Licensed under the MIT License. See LICENSE in the package root for license information.
 * ------------------------------------------------------------------------------------------ */

import getKeybindingsServiceOverride from '@codingame/monaco-vscode-keybindings-service-override';
import getLifecycleServiceOverride from '@codingame/monaco-vscode-lifecycle-service-override';
import getLocalizationServiceOverride from '@codingame/monaco-vscode-localization-service-override';
import { createDefaultLocaleConfiguration } from 'monaco-languageclient/vscode/services';
import { UserConfig } from 'monaco-editor-wrapper';
import { getTextContent } from '../../../common/example-apps-common.js';

export const createLangiumGlobalConfig = async (worker: Worker, messagePort?: MessagePort): Promise<UserConfig> => {
    const code = await getTextContent(new URL('./src/langium/statemachine/content/example.statemachine', window.location.href));

    const extensionFilesOrContents = new Map<string, string | URL>();
    const statemachineLanguageConfig = new URL('./src/langium/statemachine/config/language-configuration.json', window.location.href);
    const responseStatemachineTm = new URL('./src/langium/statemachine/syntaxes/statemachine.tmLanguage.json', window.location.href);
    extensionFilesOrContents.set('/statemachine-configuration.json', statemachineLanguageConfig);
    extensionFilesOrContents.set('/statemachine-grammar.json', responseStatemachineTm);

    return {
        wrapperConfig: {
            serviceConfig: {
                userServices: {
                    ...getKeybindingsServiceOverride(),
                    ...getLifecycleServiceOverride(),
                    ...getLocalizationServiceOverride(createDefaultLocaleConfiguration()),
                },
                debugLogging: true
            },
            editorAppConfig: {
                $type: 'extended',
                codeResources: {
                    main: {
                        text: code,
                        fileExt: 'statemachine'
                    }
                },
                useDiffEditor: false,
                extensions: [{
                    config: {
                        name: 'statemachine-example',
                        publisher: 'monaco-editor-wrapper-examples',
                        version: '1.0.0',
                        engines: {
                            vscode: '*'
                        },
                        contributes: {
                            languages: [{
                                id: 'statemachine',
                                extensions: ['.statemachine'],
                                aliases: ['statemachine', 'Statemachine'],
                                configuration: './statemachine-configuration.json'
                            }],
                            grammars: [{
                                language: 'statemachine',
                                scopeName: 'source.statemachine',
                                path: './statemachine-grammar.json'
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
            languageId: 'statemachine',
            options: {
                $type: 'WorkerDirect',
                worker,
                messagePort
            }
        }
    };
};
