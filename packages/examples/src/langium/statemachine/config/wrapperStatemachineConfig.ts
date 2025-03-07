/* --------------------------------------------------------------------------------------------
 * Copyright (c) 2024 TypeFox and others.
 * Licensed under the MIT License. See LICENSE in the package root for license information.
 * ------------------------------------------------------------------------------------------ */

import getKeybindingsServiceOverride from '@codingame/monaco-vscode-keybindings-service-override';
import getLifecycleServiceOverride from '@codingame/monaco-vscode-lifecycle-service-override';
import getLocalizationServiceOverride from '@codingame/monaco-vscode-localization-service-override';
import { createDefaultLocaleConfiguration } from 'monaco-languageclient/vscode/services';
import { LogLevel } from '@codingame/monaco-vscode-api';
import { MessageTransports } from 'vscode-languageclient';
import type { CodeContent, LanguageClientConfigs, WrapperConfig } from 'monaco-editor-wrapper';
import { configureDefaultWorkerFactory } from 'monaco-editor-wrapper/workers/workerLoaders';

// cannot be imported with assert as json contains comments
import statemachineLanguageConfig from './language-configuration.json?raw';
import responseStatemachineTm from '../syntaxes/statemachine.tmLanguage.json?raw';

export const createLangiumGlobalConfig = (params: {
    languageServerId: string,
    useLanguageClient: boolean,
    codeContent: CodeContent,
    worker?: Worker,
    messagePort?: MessagePort,
    messageTransports?: MessageTransports,
    htmlContainer: HTMLElement
}): WrapperConfig => {
    const extensionFilesOrContents = new Map<string, string | URL>();
    extensionFilesOrContents.set(`/${params.languageServerId}-statemachine-configuration.json`, statemachineLanguageConfig);
    extensionFilesOrContents.set(`/${params.languageServerId}-statemachine-grammar.json`, responseStatemachineTm);

    const languageClientConfigs: LanguageClientConfigs | undefined = params.useLanguageClient && params.worker ? {
        configs: {
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
                modified: params.codeContent
            },
            monacoWorkerFactory: configureDefaultWorkerFactory
        },
        languageClientConfigs
    };
};
