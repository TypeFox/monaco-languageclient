/* --------------------------------------------------------------------------------------------
 * Copyright (c) 2024 TypeFox and others.
 * Licensed under the MIT License. See LICENSE in the package root for license information.
 * ------------------------------------------------------------------------------------------ */

import { Uri } from 'vscode';
import getConfigurationServiceOverride from '@codingame/monaco-vscode-configuration-service-override';
import getEditorServiceOverride from '@codingame/monaco-vscode-editor-service-override';
import getKeybindingsServiceOverride from '@codingame/monaco-vscode-keybindings-service-override';
import { useOpenEditorStub } from 'monaco-editor-wrapper/vscode/services';
import { UserConfig } from 'monaco-editor-wrapper';
import { LangiumMonarchContent } from './langium.monarch.js';
import { loadLangiumWorker } from '../wrapperLangium.js';
import { getTextContent } from '../../../common/client/app-utils.js';

export const setupLangiumClientClassic = async (): Promise<UserConfig> => {
    const code = await getTextContent(new URL('./src/langium/langium-dsl/content/example.langium', window.location.href));

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
                debugLogging: true,
                workspaceConfig: {
                    workspaceProvider: {
                        trusted: true,
                        workspace: {
                            workspaceUri: Uri.file('/workspace')
                        },
                        async open() {
                            return false;
                        }
                    }
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
