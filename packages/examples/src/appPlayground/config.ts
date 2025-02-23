/* --------------------------------------------------------------------------------------------
 * Copyright (c) 2024 TypeFox and others.
 * Licensed under the MIT License. See LICENSE in the package root for license information.
 * ------------------------------------------------------------------------------------------ */

import * as vscode from 'vscode';
import { LogLevel } from '@codingame/monaco-vscode-api';
import {
    RegisteredFileSystemProvider,
    registerFileSystemOverlay,
    RegisteredMemoryFile,
} from '@codingame/monaco-vscode-files-service-override';
import getKeybindingsServiceOverride from '@codingame/monaco-vscode-keybindings-service-override';
import getLifecycleServiceOverride from '@codingame/monaco-vscode-lifecycle-service-override';
import getLocalizationServiceOverride from '@codingame/monaco-vscode-localization-service-override';
import getBannerServiceOverride from '@codingame/monaco-vscode-view-banner-service-override';
import getStatusBarServiceOverride from '@codingame/monaco-vscode-view-status-bar-service-override';
import getTitleBarServiceOverride from '@codingame/monaco-vscode-view-title-bar-service-override';
import getExplorerServiceOverride from '@codingame/monaco-vscode-explorer-service-override';
import getRemoteAgentServiceOverride from '@codingame/monaco-vscode-remote-agent-service-override';
import getEnvironmentServiceOverride from '@codingame/monaco-vscode-environment-service-override';
import getSecretStorageServiceOverride from '@codingame/monaco-vscode-secret-storage-service-override';
import getStorageServiceOverride from '@codingame/monaco-vscode-storage-service-override';
import getSearchServiceOverride from '@codingame/monaco-vscode-search-service-override';

// this is required syntax highlighting
import '@codingame/monaco-vscode-typescript-basics-default-extension';
import '@codingame/monaco-vscode-typescript-language-features-default-extension';
import '@codingame/monaco-vscode-search-result-default-extension';

import '../../resources/vsix/open-collaboration-tools.vsix';

import { createDefaultLocaleConfiguration } from 'monaco-languageclient/vscode/services';
import {
    defaultHtmlAugmentationInstructions,
    defaultViewsInit,
} from 'monaco-editor-wrapper/vscode/services';
import { configureDefaultWorkerFactory } from 'monaco-editor-wrapper/workers/workerLoaders';
import { createDefaultWorkspaceFile } from '../common/client/utils.js';
import helloTsCode from '../../resources/appPlayground/hello.ts?raw';
import testerTsCode from '../../resources/appPlayground/tester.ts?raw';
import type { WrapperConfig } from 'monaco-editor-wrapper';

export type ConfigResult = {
    wrapperConfig: WrapperConfig;
    workspaceFile: vscode.Uri;
    helloTsUri: vscode.Uri;
    testerTsUri: vscode.Uri;
};

export const configure = (htmlContainer?: HTMLElement): ConfigResult => {
    const workspaceFile = vscode.Uri.file(
        '/workspace/.vscode/workspace.code-workspace',
    );

    const wrapperConfig: WrapperConfig = {
        $type: 'extended',
        id: 'AAP',
        logLevel: LogLevel.Debug,
        htmlContainer,
        vscodeApiConfig: {
            serviceOverrides: {
                ...getKeybindingsServiceOverride(),
                ...getLifecycleServiceOverride(),
                ...getLocalizationServiceOverride(
                    createDefaultLocaleConfiguration(),
                ),
                ...getBannerServiceOverride(),
                ...getStatusBarServiceOverride(),
                ...getTitleBarServiceOverride(),
                ...getExplorerServiceOverride(),
                ...getRemoteAgentServiceOverride(),
                ...getEnvironmentServiceOverride(),
                ...getSecretStorageServiceOverride(),
                ...getStorageServiceOverride({
                    fallbackOverride: {
                        'workbench.activity.showAccounts': false,
                    },
                }),
                ...getSearchServiceOverride(),
            },
            enableExtHostWorker: true,
            viewsConfig: {
                viewServiceType: 'ViewsService',
                htmlAugmentationInstructions:
                    defaultHtmlAugmentationInstructions,
                viewsInitFunc: defaultViewsInit,
            },
            workspaceConfig: {
                enableWorkspaceTrust: true,
                windowIndicator: {
                    label: 'mlc-app-playground',
                    tooltip: '',
                    command: '',
                },
                workspaceProvider: {
                    trusted: true,
                    async open() {
                        window.open(window.location.href);
                        return true;
                    },
                    workspace: {
                        workspaceUri: workspaceFile,
                    },
                },
                configurationDefaults: {
                    'window.title':
                        'mlc-app-playground${separator}${dirty}${activeEditorShort}',
                },
                productConfiguration: {
                    nameShort: 'mlc-app-playground',
                    nameLong: 'mlc-app-playground',
                },
            },
            userConfiguration: {
                json: JSON.stringify({
                    'workbench.colorTheme': 'Default Dark Modern',
                    'editor.wordBasedSuggestions': 'off',
                    'typescript.tsserver.web.projectWideIntellisense.enabled':
                        true,
                    'typescript.tsserver.web.projectWideIntellisense.suppressSemanticErrors':
                        false,
                    'editor.guides.bracketPairsHorizontal': true,
                    'oct.serverUrl': 'https://api.open-collab.tools/',
                    'editor.experimental.asyncTokenization': false,
                }),
            },
        },
        extensions: [
            {
                config: {
                    name: 'mlc-app-playground',
                    publisher: 'TypeFox',
                    version: '1.0.0',
                    engines: {
                        vscode: '*',
                    },
                },
            },
        ],
        editorAppConfig: {
            monacoWorkerFactory: configureDefaultWorkerFactory,
        },
    };

    const helloTsUri = vscode.Uri.file('/workspace/hello.ts');
    const testerTsUri = vscode.Uri.file('/workspace/tester.ts');
    const fileSystemProvider = new RegisteredFileSystemProvider(false);
    fileSystemProvider.registerFile(
        new RegisteredMemoryFile(helloTsUri, helloTsCode),
    );
    fileSystemProvider.registerFile(
        new RegisteredMemoryFile(testerTsUri, testerTsCode),
    );
    fileSystemProvider.registerFile(
        createDefaultWorkspaceFile(workspaceFile, '/workspace'),
    );
    registerFileSystemOverlay(1, fileSystemProvider);

    return {
        wrapperConfig,
        workspaceFile,
        helloTsUri,
        testerTsUri,
    };
};
