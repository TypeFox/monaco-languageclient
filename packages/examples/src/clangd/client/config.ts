/* --------------------------------------------------------------------------------------------
 * Copyright (c) 2024 TypeFox and others.
 * Licensed under the MIT License. See LICENSE in the package root for license information.
 * ------------------------------------------------------------------------------------------ */

import { LogLevel } from '@codingame/monaco-vscode-api';
import getEnvironmentServiceOverride from '@codingame/monaco-vscode-environment-service-override';
import getExplorerServiceOverride from '@codingame/monaco-vscode-explorer-service-override';
import getKeybindingsServiceOverride from '@codingame/monaco-vscode-keybindings-service-override';
import getLifecycleServiceOverride from '@codingame/monaco-vscode-lifecycle-service-override';
import getRemoteAgentServiceOverride from '@codingame/monaco-vscode-remote-agent-service-override';
import getSecretStorageServiceOverride from '@codingame/monaco-vscode-secret-storage-service-override';
import getBannerServiceOverride from '@codingame/monaco-vscode-view-banner-service-override';
import getStatusBarServiceOverride from '@codingame/monaco-vscode-view-status-bar-service-override';
import getTitleBarServiceOverride from '@codingame/monaco-vscode-view-title-bar-service-override';
import type { EditorAppConfig } from 'monaco-languageclient/editorApp';
import type { LanguageClientConfig } from 'monaco-languageclient/lcwrapper';
import { defaultHtmlAugmentationInstructions, defaultViewsInit, type MonacoVscodeApiConfig } from 'monaco-languageclient/vscodeApiWrapper';
import { configureDefaultWorkerFactory } from 'monaco-languageclient/workerFactory';
import { Uri } from 'vscode';
import { ClangdWorkerHandler } from './workerHandler.js';

export type ClangdAppConfig = {
    languageClientConfig: LanguageClientConfig;
    vscodeApiConfig: MonacoVscodeApiConfig;
    editorAppConfig: EditorAppConfig;
}

export const createClangdAppConfig = async (config: {
    htmlContainer: HTMLElement,
    workspaceUri: Uri,
    workspaceFileUri: Uri,
    clangdWorkerHandler: ClangdWorkerHandler,
    lsMessageLocalPort: MessagePort
}): Promise<ClangdAppConfig> => {
    const vscodeApiConfig: MonacoVscodeApiConfig = {
        $type: 'extended',
        logLevel: LogLevel.Debug,
        serviceOverrides: {
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
            $type: 'ViewsService',
            htmlContainer: config.htmlContainer,
            htmlAugmentationInstructions: defaultHtmlAugmentationInstructions,
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
        },
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
        monacoWorkerFactory: configureDefaultWorkerFactory
    };

    const languageClientConfig: LanguageClientConfig = {
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
            documentSelector: ['cpp'],
            workspaceFolder: {
                index: 0,
                name: 'workspace',
                uri: config.workspaceUri
            }
        }
    };

    const editorAppConfig: EditorAppConfig = {};

    return {
        vscodeApiConfig,
        languageClientConfig,
        editorAppConfig
    };
};
