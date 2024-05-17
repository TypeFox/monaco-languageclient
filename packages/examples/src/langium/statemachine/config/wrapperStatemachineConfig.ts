/* --------------------------------------------------------------------------------------------
 * Copyright (c) 2024 TypeFox and others.
 * Licensed under the MIT License. See LICENSE in the package root for license information.
 * ------------------------------------------------------------------------------------------ */

import getKeybindingsServiceOverride from '@codingame/monaco-vscode-keybindings-service-override';
import getLifecycleServiceOverride from '@codingame/monaco-vscode-lifecycle-service-override';
import getLocalizationServiceOverride from '@codingame/monaco-vscode-localization-service-override';
import { createDefaultLocaleConfiguration } from 'monaco-languageclient/vscode/services';
import { UserConfig } from 'monaco-editor-wrapper';
// cannot be imported with assert as json contains comments
// @ts-expect-error otherwise the vite notation leads to a compile error
import statemachineLanguageConfig from './language-configuration.json?raw';
import responseStatemachineTm from '../syntaxes/statemachine.tmLanguage.json' assert { type: 'json' };

export const createLangiumGlobalConfig = async (params: {
    text?: string,
    worker: Worker,
    messagePort?: MessagePort
}): Promise<UserConfig> => {
    const extensionFilesOrContents = new Map<string, string | URL>();
    extensionFilesOrContents.set('/statemachine-configuration.json', statemachineLanguageConfig);
    extensionFilesOrContents.set('/statemachine-grammar.json', JSON.stringify(responseStatemachineTm));

    let main;
    if (params.text) {
        main = {
            text: params.text,
            fileExt: 'statemachine'
        };
    }

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
                    main
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
                worker: params.worker,
                messagePort: params.messagePort
            }
        }
    };
};
