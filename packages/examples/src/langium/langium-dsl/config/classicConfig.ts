/* --------------------------------------------------------------------------------------------
 * Copyright (c) 2024 TypeFox and others.
 * Licensed under the MIT License. See LICENSE in the package root for license information.
 * ------------------------------------------------------------------------------------------ */

import getConfigurationServiceOverride from '@codingame/monaco-vscode-configuration-service-override';
import getEditorServiceOverride from '@codingame/monaco-vscode-editor-service-override';
import getKeybindingsServiceOverride from '@codingame/monaco-vscode-keybindings-service-override';
import { useOpenEditorStub } from 'monaco-editor-wrapper/vscode/services';
import { LogLevel } from 'vscode/services';
import { Logger } from 'monaco-languageclient/tools';
import { WrapperConfig } from 'monaco-editor-wrapper';
import { LangiumMonarchContent } from './langium.monarch.js';
import { loadLangiumWorker } from '../wrapperLangium.js';
import code from '../content/example.langium?raw';
import { useWorkerFactory } from 'monaco-editor-wrapper/workerFactory';

export const setupLangiumClientClassic = async (): Promise<WrapperConfig> => {
    const langiumWorker = loadLangiumWorker();
    return {
        logLevel: LogLevel.Debug,
        vscodeApiConfig: {
            userServices: {
                ...getConfigurationServiceOverride(),
                ...getEditorServiceOverride(useOpenEditorStub),
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
                languageId: 'langium',
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
