/* --------------------------------------------------------------------------------------------
 * Copyright (c) 2024 TypeFox and others.
 * Licensed under the MIT License. See LICENSE in the package root for license information.
 * ------------------------------------------------------------------------------------------ */

import getKeybindingsServiceOverride from '@codingame/monaco-vscode-keybindings-service-override';
import getLifecycleServiceOverride from '@codingame/monaco-vscode-lifecycle-service-override';
import getLocalizationServiceOverride from '@codingame/monaco-vscode-localization-service-override';
import { IConnectionProvider } from 'monaco-languageclient';
import { createDefaultLocaleConfiguration } from 'monaco-languageclient/vscode/services';
import { LanguageClientConfig, UserConfig } from 'monaco-editor-wrapper';
// cannot be imported with assert as json contains comments
import statemachineLanguageConfig from './language-configuration.json?raw';
import responseStatemachineTm from '../syntaxes/statemachine.tmLanguage.json?raw';

export const createLangiumGlobalConfig = async (params: {
    languageServerId: string,
    useLanguageClient: boolean,
    text?: string,
    worker?: Worker,
    messagePort?: MessagePort,
    connectionProvider?: IConnectionProvider
}): Promise<UserConfig> => {
    const extensionFilesOrContents = new Map<string, string | URL>();
    extensionFilesOrContents.set(`/${params.languageServerId}-statemachine-configuration.json`, statemachineLanguageConfig);
    extensionFilesOrContents.set(`/${params.languageServerId}-statemachine-grammar.json`, responseStatemachineTm);

    let main;
    if (params.text !== undefined) {
        main = {
            text: params.text,
            fileExt: 'statemachine'
        };
    }

    const languageClientConfig: LanguageClientConfig | undefined = params.useLanguageClient && params.worker ? {
        languageId: 'statemachine',
        options: {
            $type: 'WorkerDirect',
            worker: params.worker,
            messagePort: params.messagePort,
        },
        connectionProvider: params.connectionProvider
    } : undefined;

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
                                configuration: `./${params.languageServerId}-statemachine-configuration.json`
                            }],
                            grammars: [{
                                language: 'statemachine',
                                scopeName: 'source.statemachine',
                                path: `./${params.languageServerId}-statemachine-grammar.json`
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
        languageClientConfig,
        loggerConfig: {
            enabled: true,
            debugEnabled: true
        }
    };
};
