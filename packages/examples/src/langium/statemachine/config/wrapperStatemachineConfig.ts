/* --------------------------------------------------------------------------------------------
 * Copyright (c) 2024 TypeFox and others.
 * Licensed under the MIT License. See LICENSE in the package root for license information.
 * ------------------------------------------------------------------------------------------ */

import getKeybindingsServiceOverride from '@codingame/monaco-vscode-keybindings-service-override';
import getLifecycleServiceOverride from '@codingame/monaco-vscode-lifecycle-service-override';
import getLocalizationServiceOverride from '@codingame/monaco-vscode-localization-service-override';
import { createDefaultLocaleConfiguration } from 'monaco-languageclient/vscode/services';
import { LogLevel } from '@codingame/monaco-vscode-api';
import { LanguageClientConfig, WrapperConfig } from 'monaco-editor-wrapper';
// cannot be imported with assert as json contains comments
import statemachineLanguageConfig from './language-configuration.json?raw';
import responseStatemachineTm from '../syntaxes/statemachine.tmLanguage.json?raw';
import { MessageTransports } from 'vscode-languageclient';
import { configureMonacoWorkers } from '../../../common/client/utils.js';

export const createLangiumGlobalConfig = async (params: {
    languageServerId: string,
    useLanguageClient: boolean,
    text?: string,
    worker?: Worker,
    messagePort?: MessagePort,
    messageTransports?: MessageTransports,
    htmlContainer: HTMLElement
}): Promise<WrapperConfig> => {
    const extensionFilesOrContents = new Map<string, string | URL>();
    extensionFilesOrContents.set(`/${params.languageServerId}-statemachine-configuration.json`, statemachineLanguageConfig);
    extensionFilesOrContents.set(`/${params.languageServerId}-statemachine-grammar.json`, responseStatemachineTm);

    let modified;
    if (params.text !== undefined) {
        modified = {
            text: params.text,
            fileExt: 'statemachine'
        };
    }

    const languageClientConfigs: Record<string, LanguageClientConfig> | undefined = params.useLanguageClient && params.worker ? {
        statemachine: {
            clientOptions: {
                documentSelector: ['statemachine']
            },
            connection: {
                options: {
                    $type: 'WorkerDirect',
                    worker: params.worker,
                    messagePort: params.messagePort,
                },
                messageTransports: params.messageTransports
            }
        }
    } : undefined;

    return {
        $type: 'extended',
        htmlContainer: params.htmlContainer,
        logLevel: LogLevel.Debug,
        vscodeApiConfig: {
            serviceOverrides: {
                ...getKeybindingsServiceOverride(),
                ...getLifecycleServiceOverride(),
                ...getLocalizationServiceOverride(createDefaultLocaleConfiguration()),
            },
            userConfiguration: {
                json: JSON.stringify({
                    'workbench.colorTheme': 'Default Dark Modern',
                    'editor.guides.bracketPairsHorizontal': 'active',
                    'editor.wordBasedSuggestions': 'off',
                    'editor.experimental.asyncTokenization': true
                })
            },
        },
        extensions: [{
            config: {
                name: 'statemachine-example',
                publisher: 'TypeFox',
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
        editorAppConfig: {
            codeResources: {
                modified
            },
            monacoWorkerFactory: configureMonacoWorkers
        },
        languageClientConfigs
    };
};
