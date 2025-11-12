/* --------------------------------------------------------------------------------------------
 * Copyright (c) 2024 TypeFox and others.
 * Licensed under the MIT License. See LICENSE in the package root for license information.
 * ------------------------------------------------------------------------------------------ */

import { LogLevel } from '@codingame/monaco-vscode-api';
import getEnvironmentServiceOverride from '@codingame/monaco-vscode-environment-service-override';
import getExplorerServiceOverride from '@codingame/monaco-vscode-explorer-service-override';
import { InMemoryFileSystemProvider, registerFileSystemOverlay, type IFileWriteOptions } from '@codingame/monaco-vscode-files-service-override';
import getKeybindingsServiceOverride from '@codingame/monaco-vscode-keybindings-service-override';
import getLifecycleServiceOverride from '@codingame/monaco-vscode-lifecycle-service-override';
import getLocalizationServiceOverride from '@codingame/monaco-vscode-localization-service-override';
import getOutlineServiceOverride from '@codingame/monaco-vscode-outline-service-override';
import getRemoteAgentServiceOverride from '@codingame/monaco-vscode-remote-agent-service-override';
import getSearchServiceOverride from '@codingame/monaco-vscode-search-service-override';
import getSecretStorageServiceOverride from '@codingame/monaco-vscode-secret-storage-service-override';
import getStorageServiceOverride from '@codingame/monaco-vscode-storage-service-override';
import getBannerServiceOverride from '@codingame/monaco-vscode-view-banner-service-override';
import getStatusBarServiceOverride from '@codingame/monaco-vscode-view-status-bar-service-override';
import getTitleBarServiceOverride from '@codingame/monaco-vscode-view-title-bar-service-override';
import * as vscode from 'vscode';

// this is required syntax highlighting
import '@codingame/monaco-vscode-javascript-default-extension';
import '@codingame/monaco-vscode-json-default-extension';
import '@codingame/monaco-vscode-json-language-features-default-extension';
import '@codingame/monaco-vscode-search-result-default-extension';
import '@codingame/monaco-vscode-typescript-basics-default-extension';
import '@codingame/monaco-vscode-typescript-language-features-default-extension';

import '../../resources/vsix/open-collaboration-tools.vsix';

import { createDefaultLocaleConfiguration } from 'monaco-languageclient/vscodeApiLocales';
import { defaultHtmlAugmentationInstructions, defaultViewsInit, type MonacoVscodeApiConfig } from 'monaco-languageclient/vscodeApiWrapper';
import { configureDefaultWorkerFactory } from 'monaco-languageclient/workerFactory';
import helloTsCode from '../../resources/appPlayground/hello.ts?raw';
import testerTsCode from '../../resources/appPlayground/tester.ts?raw';
import helloJsonCode from '../../resources/appPlayground/hello.json?raw';
import { createDefaultWorkspaceContent } from '../common/client/utils.js';

export type ConfigResult = {
    vscodeApiConfig: MonacoVscodeApiConfig;
    workspaceFileUri: vscode.Uri;
    helloTsUri: vscode.Uri;
    testerTsUri: vscode.Uri;
    helloJsonUri: vscode.Uri;
};

export const configure = async (htmlContainer?: HTMLElement): Promise<ConfigResult> => {
    const workspaceFileUri = vscode.Uri.file('/workspace.code-workspace');

    const vscodeApiConfig: MonacoVscodeApiConfig = {
        $type: 'extended',
        logLevel: LogLevel.Debug,
        serviceOverrides: {
            ...getKeybindingsServiceOverride(),
            ...getLifecycleServiceOverride(),
            ...getLocalizationServiceOverride(createDefaultLocaleConfiguration()),
            ...getBannerServiceOverride(),
            ...getStatusBarServiceOverride(),
            ...getTitleBarServiceOverride(),
            ...getExplorerServiceOverride(),
            ...getRemoteAgentServiceOverride(),
            ...getEnvironmentServiceOverride(),
            ...getSecretStorageServiceOverride(),
            ...getStorageServiceOverride(),
            ...getSearchServiceOverride(),
            ...getOutlineServiceOverride()
        },
        viewsConfig: {
            $type: 'ViewsService',
            htmlContainer,
            htmlAugmentationInstructions: defaultHtmlAugmentationInstructions,
            viewsInitFunc: defaultViewsInit
        },
        workspaceConfig: {
            enableWorkspaceTrust: true,
            windowIndicator: {
                label: 'mlc-app-playground',
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
                    workspaceUri: workspaceFileUri
                }
            },
            configurationDefaults: {
                'window.title': 'mlc-app-playground${separator}${dirty}${activeEditorShort}'
            },
            productConfiguration: {
                nameShort: 'mlc-app-playground',
                nameLong: 'mlc-app-playground'
            }
        },
        userConfiguration: {
            json: JSON.stringify({
                'workbench.colorTheme': 'Default Dark Modern',
                'editor.wordBasedSuggestions': 'off',
                'typescript.tsserver.web.projectWideIntellisense.enabled': true,
                'typescript.tsserver.web.projectWideIntellisense.suppressSemanticErrors': false,
                'editor.guides.bracketPairsHorizontal': true,
                'oct.serverUrl': 'https://api.open-collab.tools/',
                'editor.experimental.asyncTokenization': true
            })
        },
        extensions: [{
            config: {
                name: 'mlc-app-playground',
                publisher: 'TypeFox',
                version: '1.0.0',
                engines: {
                    vscode: '*'
                }
            }
        }],
        advanced: {
            enableExtHostWorker: true,
        },
        monacoWorkerFactory: configureDefaultWorkerFactory
    };

    const workspaceUri = vscode.Uri.file('/workspace');
    const helloTsUri = vscode.Uri.file('/workspace/hello.ts');
    const testerTsUri = vscode.Uri.file('/workspace/tester.ts');
    const helloJsonUri = vscode.Uri.file('/workspace/hello.json');
    const fileSystemProvider = new InMemoryFileSystemProvider();
    const textEncoder = new TextEncoder();

    const options: IFileWriteOptions = {
        atomic: false,
        unlock: false,
        create: true,
        overwrite: true
    };
    await fileSystemProvider.mkdir(workspaceUri);
    await fileSystemProvider.writeFile(helloTsUri, textEncoder.encode(helloTsCode), options);
    await fileSystemProvider.writeFile(testerTsUri, textEncoder.encode(testerTsCode), options);
    await fileSystemProvider.writeFile(helloJsonUri, textEncoder.encode(helloJsonCode), options);
    await fileSystemProvider.writeFile(workspaceFileUri, textEncoder.encode(createDefaultWorkspaceContent('/workspace')), options);
    registerFileSystemOverlay(1, fileSystemProvider);

    return {
        vscodeApiConfig,
        workspaceFileUri,
        helloTsUri,
        testerTsUri,
        helloJsonUri
    };
};
