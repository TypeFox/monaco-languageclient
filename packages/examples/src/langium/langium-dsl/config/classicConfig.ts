/* --------------------------------------------------------------------------------------------
 * Copyright (c) 2024 TypeFox and others.
 * Licensed under the MIT License. See LICENSE in the package root for license information.
 * ------------------------------------------------------------------------------------------ */

import getConfigurationServiceOverride from '@codingame/monaco-vscode-configuration-service-override';
import getKeybindingsServiceOverride from '@codingame/monaco-vscode-keybindings-service-override';
import { LogLevel } from '@codingame/monaco-vscode-api';
import type { Logger } from 'monaco-languageclient/tools';
import { useWorkerFactory } from 'monaco-languageclient/workerFactory';
import type { WrapperConfig } from 'monaco-editor-wrapper';
import { LangiumMonarchContent } from './langium.monarch.js';
import code from '../../../../resources/langium/langium-dsl/example.langium?raw';
import { defineDefaultWorkerLoaders } from '../../../common/client/utils.js';

export const setupLangiumClientClassic = async (langiumWorker: Worker): Promise<WrapperConfig> => {
    const workerLoaders = defineDefaultWorkerLoaders();
    workerLoaders.TextMateWorker = undefined;
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
                    workerLoaders,
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
