/* --------------------------------------------------------------------------------------------
 * Copyright (c) 2024 TypeFox and others.
 * Licensed under the MIT License. See LICENSE in the package root for license information.
 * ------------------------------------------------------------------------------------------ */

import getConfigurationServiceOverride from '@codingame/monaco-vscode-configuration-service-override';
import getEditorServiceOverride from '@codingame/monaco-vscode-editor-service-override';
import getKeybindingsServiceOverride from '@codingame/monaco-vscode-keybindings-service-override';
import { useOpenEditorStub } from 'monaco-editor-wrapper/vscode/services';
import { UserConfig } from 'monaco-editor-wrapper';
import { LangiumMonarchContent } from './langium.monarch.js';
import { loadLangiumWorker } from '../wrapperLangium.js';
import code from '../content/example.langium?raw';

export const setupLangiumClientClassic = async (): Promise<UserConfig> => {
    const langiumWorker = loadLangiumWorker();
    return {
        loggerConfig: {
            enabled: true,
            debugEnabled: true
        },
        wrapperConfig: {
            serviceConfig: {
                userServices: {
                    ...getConfigurationServiceOverride(),
                    ...getEditorServiceOverride(useOpenEditorStub),
                    ...getKeybindingsServiceOverride()
                },
                debugLogging: true
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
                }
            }
        },
        languageClientConfig: {
            languageId: 'langium',
            options: {
                $type: 'WorkerDirect',
                worker: langiumWorker
            }
        }
    };
};
