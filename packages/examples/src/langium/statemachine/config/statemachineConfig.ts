/* --------------------------------------------------------------------------------------------
 * Copyright (c) 2024 TypeFox and others.
 * Licensed under the MIT License. See LICENSE in the package root for license information.
 * ------------------------------------------------------------------------------------------ */

import getKeybindingsServiceOverride from '@codingame/monaco-vscode-keybindings-service-override';
import getLifecycleServiceOverride from '@codingame/monaco-vscode-lifecycle-service-override';
import getLocalizationServiceOverride from '@codingame/monaco-vscode-localization-service-override';
import { LogLevel } from '@codingame/monaco-vscode-api';
import { MessageTransports } from 'vscode-languageclient';
import { createDefaultLocaleConfiguration } from 'monaco-languageclient/vscodeApiLocales';
import type { MonacoVscodeApiConfig } from 'monaco-languageclient/vscodeApiWrapper';
import type { LanguageClientConfig } from 'monaco-languageclient/lcwrapper';
import { configureDefaultWorkerFactory } from 'monaco-languageclient/workerFactory';
import type { CodeContent, EditorAppConfig } from 'monaco-languageclient/editorApp';

// cannot be imported with assert as json contains comments
import statemachineLanguageConfig from './language-configuration.json?raw';
import responseStatemachineTm from '../syntaxes/statemachine.tmLanguage.json?raw';
import type { ExampleAppConfig } from '../../../common/client/utils.js';

export const createLangiumGlobalConfig = (params: {
    languageServerId: string,
    codeContent: CodeContent,
    worker: Worker,
    messagePort?: MessagePort,
    messageTransports?: MessageTransports,
    htmlContainer?: HTMLElement
}): ExampleAppConfig => {
    const extensionFilesOrContents = new Map<string, string | URL>();
    extensionFilesOrContents.set(`/${params.languageServerId}-statemachine-configuration.json`, statemachineLanguageConfig);
    extensionFilesOrContents.set(`/${params.languageServerId}-statemachine-grammar.json`, responseStatemachineTm);

    const languageClientConfig: LanguageClientConfig = {
        languageId: 'statemachine',
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
        },
        logLevel: LogLevel.Off
    };

    const vscodeApiConfig: MonacoVscodeApiConfig = {
        $type: 'extended',
        viewsConfig: {
            $type: 'EditorService',
            htmlContainer: params.htmlContainer
        },
        logLevel: LogLevel.Off,
        serviceOverrides: {
            ...getKeybindingsServiceOverride(),
            ...getLifecycleServiceOverride(),
            ...getLocalizationServiceOverride(createDefaultLocaleConfiguration()),
        },
        monacoWorkerFactory: configureDefaultWorkerFactory,
        userConfiguration: {
            json: JSON.stringify({
                'workbench.colorTheme': 'Default Dark Modern',
                'editor.guides.bracketPairsHorizontal': 'active',
                'editor.wordBasedSuggestions': 'off',
                'editor.experimental.asyncTokenization': true
            })
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
        }]
    };

    const editorAppConfig: EditorAppConfig = {
        codeResources: {
            modified: params.codeContent
        },
        logLevel: LogLevel.Debug
    };

    return {
        editorAppConfig,
        vscodeApiConfig,
        languageClientConfig
    };
};
