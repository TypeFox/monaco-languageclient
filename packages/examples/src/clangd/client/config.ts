/* --------------------------------------------------------------------------------------------
 * Copyright (c) 2024 TypeFox and others.
 * Licensed under the MIT License. See LICENSE in the package root for license information.
 * ------------------------------------------------------------------------------------------ */

import { Uri } from 'vscode';
import getConfigurationServiceOverride from '@codingame/monaco-vscode-configuration-service-override';
import getKeybindingsServiceOverride from '@codingame/monaco-vscode-keybindings-service-override';
import getLifecycleServiceOverride from '@codingame/monaco-vscode-lifecycle-service-override';
import getBannerServiceOverride from '@codingame/monaco-vscode-view-banner-service-override';
import getStatusBarServiceOverride from '@codingame/monaco-vscode-view-status-bar-service-override';
import getTitleBarServiceOverride from '@codingame/monaco-vscode-view-title-bar-service-override';
import getExplorerServiceOverride from '@codingame/monaco-vscode-explorer-service-override';
import getRemoteAgentServiceOverride from '@codingame/monaco-vscode-remote-agent-service-override';
import getEnvironmentServiceOverride from '@codingame/monaco-vscode-environment-service-override';
import getSecretStorageServiceOverride from '@codingame/monaco-vscode-secret-storage-service-override';
import { LogLevel } from 'vscode/services';
import { WrapperConfig } from 'monaco-editor-wrapper';
import { configureMonacoWorkers } from '../../common/client/utils.js';
import { ClangdWorkerHandler } from './workerHandler.js';
import { defaultViewsInit } from 'monaco-editor-wrapper/vscode/services';

export const createWrapperConfig = async (config: {
    htmlContainer: HTMLElement,
    workspaceUri: Uri,
    workspaceFileUri: Uri,
    clangdWorkerHandler: ClangdWorkerHandler,
    lsMessageLocalPort: MessagePort
}): Promise<WrapperConfig> => {
    const languageId = 'cpp';
    return {
        logLevel: LogLevel.Debug,
        languageClientConfigs: {
            LANGUAGE_ID: {
                languageId: languageId,
                name: 'Clangd WASM Language Server',
                connection: {
                    options: {
                        $type: 'WorkerDirect',
                        worker: await config.clangdWorkerHandler.createWorker(),
                        messagePort: config.lsMessageLocalPort
                    }
                },
                restartOptions: {
                    retries: 5,
                    timeout: 1000,
                    keepWorker: true
                },
                clientOptions: {
                    documentSelector: [languageId],
                    workspaceFolder: {
                        index: 0,
                        name: 'workspace',
                        uri: config.workspaceUri
                    }
                }
            }
        },
        vscodeApiConfig: {
            userServices: {
                ...getConfigurationServiceOverride(),
                ...getKeybindingsServiceOverride(),
                ...getLifecycleServiceOverride(),
                ...getBannerServiceOverride(),
                ...getStatusBarServiceOverride(),
                ...getTitleBarServiceOverride(),
                ...getExplorerServiceOverride(),
                ...getRemoteAgentServiceOverride(),
                ...getEnvironmentServiceOverride(),
                ...getSecretStorageServiceOverride()
            },
            viewsConfig: {
                viewServiceType: 'ViewsService',
                viewsInitFunc: defaultViewsInit
            },
            workspaceConfig: {
                enableWorkspaceTrust: true,
                windowIndicator: {
                    label: 'mlc-clangd-example',
                    tooltip: '',
                    command: ''
                },
                workspaceProvider: {
                    trusted: true,
                    async open() {
                        window.open(window.location.href);
                        return true;
                    },
                    workspace: {
                        workspaceUri: config.workspaceFileUri
                    },
                },
                configurationDefaults: {
                    'window.title': 'mlc-clangd-exampled${separator}${dirty}${activeEditorShort}'
                },
                productConfiguration: {
                    nameShort: 'mlc-clangd-example',
                    nameLong: 'mlc-clangd-example'
                }
            },
            userConfiguration: {
                json: JSON.stringify({
                    'workbench.colorTheme': 'Default Dark Modern',
                    'editor.wordBasedSuggestions': 'off',
                    'editor.guides.bracketPairsHorizontal': true,
                    'editor.inlayHints.enabled': 'offUnlessPressed',
                    'editor.quickSuggestionsDelay': 200,
                    'editor.experimental.asyncTokenization': false
                })
            }
        },
        editorAppConfig: {
            $type: 'extended',
            extensions: [{
                config: {
                    name: 'mlc-clangd-example',
                    publisher: 'TypeFox',
                    version: '1.0.0',
                    engines: {
                        vscode: '*'
                    }
                }
            }],
            monacoWorkerFactory: configureMonacoWorkers,
            htmlContainer: config.htmlContainer
        }
    };
};
