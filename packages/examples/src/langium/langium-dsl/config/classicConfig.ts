/* --------------------------------------------------------------------------------------------
 * Copyright (c) 2024 TypeFox and others.
 * Licensed under the MIT License. See LICENSE in the package root for license information.
 * ------------------------------------------------------------------------------------------ */

import getConfigurationServiceOverride from '@codingame/monaco-vscode-configuration-service-override';
import getKeybindingsServiceOverride from '@codingame/monaco-vscode-keybindings-service-override';
import { LogLevel } from '@codingame/monaco-vscode-api/services';
import { Logger } from 'monaco-languageclient/tools';
import { WrapperConfig } from 'monaco-editor-wrapper';
import { LangiumMonarchContent } from './langium.monarch.js';
import { useWorkerFactory } from 'monaco-editor-wrapper/workerFactory';
import code from '../../../../resources/langium/langium-dsl/example.langium?raw';

export const setupLangiumClientClassic = async (langiumWorker: Worker): Promise<WrapperConfig> => {
    return {
        $type: 'classic',
        htmlContainer: document.getElementById('monaco-editor-root')!,
        logLevel: LogLevel.Debug,
        vscodeApiConfig: {
            serviceOverrides: {
                ...getConfigurationServiceOverride(),
                ...getKeybindingsServiceOverride()
            }
        },
        editorAppConfig: {
            codeResources: {
                modified: {
                    text: code,
                    fileExt: 'langium',
                    enforceLanguageId: 'langium'
                }
            },
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
            }
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
                    }
                }
            }
        }
    };
};
