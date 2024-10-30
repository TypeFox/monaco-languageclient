/* --------------------------------------------------------------------------------------------
 * Copyright (c) 2024 TypeFox and others.
 * Licensed under the MIT License. See LICENSE in the package root for license information.
 * ------------------------------------------------------------------------------------------ */

import * as vscode from 'vscode';
import { LogLevel } from 'vscode/services';
import getConfigurationServiceOverride from '@codingame/monaco-vscode-configuration-service-override';
import getKeybindingsServiceOverride from '@codingame/monaco-vscode-keybindings-service-override';
import getLifecycleServiceOverride from '@codingame/monaco-vscode-lifecycle-service-override';
import getLocalizationServiceOverride from '@codingame/monaco-vscode-localization-service-override';
import getBannerServiceOverride from '@codingame/monaco-vscode-view-banner-service-override';
import getStatusBarServiceOverride from '@codingame/monaco-vscode-view-status-bar-service-override';
import getTitleBarServiceOverride from '@codingame/monaco-vscode-view-title-bar-service-override';
import getExplorerServiceOverride from '@codingame/monaco-vscode-explorer-service-override';
import { RegisteredFileSystemProvider, registerFileSystemOverlay, RegisteredMemoryFile } from '@codingame/monaco-vscode-files-service-override';
import getRemoteAgentServiceOverride from '@codingame/monaco-vscode-remote-agent-service-override';
import getEnvironmentServiceOverride from '@codingame/monaco-vscode-environment-service-override';
import getSecretStorageServiceOverride from '@codingame/monaco-vscode-secret-storage-service-override';
// this is required syntax highlighting
import '@codingame/monaco-vscode-typescript-basics-default-extension';
import '@codingame/monaco-vscode-typescript-language-features-default-extension';

import '../../resources/vsix/open-collaboration-tools.vsix';

import { EditorAppExtended, MonacoEditorLanguageClientWrapper, RegisterLocalProcessExtensionResult, WrapperConfig } from 'monaco-editor-wrapper';
import { createDefaultLocaleConfiguration } from 'monaco-languageclient/vscode/services';
import { configureMonacoWorkers, createDefaultWorkspaceFile } from '../common/client/utils.js';
import helloTsCode from '../../resources/appPlayground/hello.ts?raw';
import testerTsCode from '../../resources/appPlayground/tester.ts?raw';
import { defaultViewsHtml, defaultViewsInit } from 'monaco-editor-wrapper/vscode/services';

const wrapper = new MonacoEditorLanguageClientWrapper();

export const runApplicationPlayground = async () => {
    const workspaceFile = vscode.Uri.file('/workspace/.vscode/workspace.code-workspace');

    const wrapperConfig: WrapperConfig = {
        id: 'AAP',
        logLevel: LogLevel.Debug,
        vscodeApiConfig: {
            userServices: {
                ...getConfigurationServiceOverride(),
                ...getKeybindingsServiceOverride(),
                ...getLifecycleServiceOverride(),
                ...getLocalizationServiceOverride(createDefaultLocaleConfiguration()),
                ...getBannerServiceOverride(),
                ...getStatusBarServiceOverride(),
                ...getTitleBarServiceOverride(),
                ...getExplorerServiceOverride(),
                ...getRemoteAgentServiceOverride(),
                ...getEnvironmentServiceOverride(),
                ...getSecretStorageServiceOverride()
            },
            enableExtHostWorker: true,
            viewsConfig: {
                viewServiceType: 'ViewsService',
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
                        workspaceUri: workspaceFile
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
                    'editor.experimental.asyncTokenization': false
                })
            },
        },
        editorAppConfig: {
            $type: 'extended',
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
            monacoWorkerFactory: configureMonacoWorkers,
            htmlContainer: document.body
        }
    };

    const htmlContainer = document.createElement('div', { is: 'app' });
    htmlContainer.innerHTML = defaultViewsHtml;
    document.body.append(htmlContainer);

    const helloTsUri = vscode.Uri.file('/workspace/hello.ts');
    const testerTsUri = vscode.Uri.file('/workspace/tester.ts');
    const fileSystemProvider = new RegisteredFileSystemProvider(false);
    fileSystemProvider.registerFile(new RegisteredMemoryFile(helloTsUri, helloTsCode));
    fileSystemProvider.registerFile(new RegisteredMemoryFile(testerTsUri, testerTsCode));
    fileSystemProvider.registerFile(createDefaultWorkspaceFile(workspaceFile, '/workspace'));
    registerFileSystemOverlay(1, fileSystemProvider);

    await wrapper.init(wrapperConfig);
    const result = (wrapper.getMonacoEditorApp() as EditorAppExtended).getExtensionRegisterResult('mlc-app-playground') as RegisterLocalProcessExtensionResult;
    result.setAsDefaultApi();

    await Promise.all([
        await vscode.window.showTextDocument(helloTsUri),
        await vscode.window.showTextDocument(testerTsUri, { viewColumn: vscode.ViewColumn.Two })
    ]);
};