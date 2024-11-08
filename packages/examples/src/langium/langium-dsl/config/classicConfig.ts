/* --------------------------------------------------------------------------------------------
 * Copyright (c) 2024 TypeFox and others.
 * Licensed under the MIT License. See LICENSE in the package root for license information.
 * ------------------------------------------------------------------------------------------ */

import getConfigurationServiceOverride from '@codingame/monaco-vscode-configuration-service-override';
import getKeybindingsServiceOverride from '@codingame/monaco-vscode-keybindings-service-override';
import { LogLevel } from 'vscode/services';
import { Logger } from 'monaco-languageclient/tools';
import { WrapperConfig } from 'monaco-editor-wrapper';
import { LangiumMonarchContent } from './langium.monarch.js';
import { loadLangiumWorker } from '../wrapperLangium.js';
import { useWorkerFactory } from 'monaco-editor-wrapper/workerFactory';
import code from '../../../../resources/langium/langium-dsl/example.langium?raw';

export const setupLangiumClientClassic = async (): Promise<WrapperConfig> => {
    const langiumWorker = loadLangiumWorker();
    return {
        logLevel: LogLevel.Debug,
        vscodeApiConfig: {
            userServices: {
                ...getConfigurationServiceOverride(),
                ...getKeybindingsServiceOverride()
            }
        },
        editorAppConfig: {
            $type: 'classic',
            codeResources: {
                main: {
                    text: code,
                    fileExt: 'langium',
                    enforceLanguageId: 'langium'
                }
            },
            useDiffEditor: false,
            editorOptions: {
                'semanticHighlighting.enabled': true,
                wordBasedSuggestions: 'off',
                theme: 'vs-dark'
            },
            languageDef: {
                monarchLanguage: LangiumMonarchContent,
                languageExtensionConfig: { id: 'langium' },
            },
            monacoWorkerFactory: (logger?: Logger) => {
                useWorkerFactory({
                    logger
                });
            },
            htmlContainer: document.getElementById('monaco-editor-root')!
        },
        languageClientConfigs: {
            langium: {
                clientOptionsOrLanguageIds: ['langium'],
                connection: {
                    options: {
                        $type: 'WorkerDirect',
                        worker: langiumWorker
                    }
                }
            }
        }
    };
};
