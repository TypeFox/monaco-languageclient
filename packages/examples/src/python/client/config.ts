/* --------------------------------------------------------------------------------------------
 * Copyright (c) 2024 TypeFox and others.
 * Licensed under the MIT License. See LICENSE in the package root for license information.
 * ------------------------------------------------------------------------------------------ */

import { LogLevel } from '@codingame/monaco-vscode-api';
import getDebugServiceOverride from '@codingame/monaco-vscode-debug-service-override';
import getEnvironmentServiceOverride from '@codingame/monaco-vscode-environment-service-override';
import getExplorerServiceOverride from '@codingame/monaco-vscode-explorer-service-override';
import { RegisteredFileSystemProvider, RegisteredMemoryFile, registerFileSystemOverlay } from '@codingame/monaco-vscode-files-service-override';
import getKeybindingsServiceOverride from '@codingame/monaco-vscode-keybindings-service-override';
import getLifecycleServiceOverride from '@codingame/monaco-vscode-lifecycle-service-override';
import getLocalizationServiceOverride from '@codingame/monaco-vscode-localization-service-override';
import getPreferencesServiceOverride from '@codingame/monaco-vscode-preferences-service-override';
import '@codingame/monaco-vscode-python-default-extension';
import getRemoteAgentServiceOverride from '@codingame/monaco-vscode-remote-agent-service-override';
import getSearchServiceOverride from '@codingame/monaco-vscode-search-service-override';
import getSecretStorageServiceOverride from '@codingame/monaco-vscode-secret-storage-service-override';
import getStorageServiceOverride from '@codingame/monaco-vscode-storage-service-override';
import getTestingServiceOverride from '@codingame/monaco-vscode-testing-service-override';
import getBannerServiceOverride from '@codingame/monaco-vscode-view-banner-service-override';
import getStatusBarServiceOverride from '@codingame/monaco-vscode-view-status-bar-service-override';
import getTitleBarServiceOverride from '@codingame/monaco-vscode-view-title-bar-service-override';
import { createUrl } from 'monaco-languageclient/common';
import { createDebugLaunchConfigFile, provideDebuggerExtensionConfig, type ConfigParams, type FileDefinition } from 'monaco-languageclient/debugger';
import type { EditorAppConfig } from 'monaco-languageclient/editorApp';
import type { LanguageClientConfig } from 'monaco-languageclient/lcwrapper';
import { createDefaultLocaleConfiguration } from 'monaco-languageclient/vscodeApiLocales';
import { defaultHtmlAugmentationInstructions, defaultViewsInit, type MonacoVscodeApiConfig } from 'monaco-languageclient/vscodeApiWrapper';
import { configureDefaultWorkerFactory } from 'monaco-languageclient/workerFactory';
import * as vscode from 'vscode';
import type { BaseLanguageClient } from 'vscode-languageclient/browser.js';
import { toSocket, WebSocketMessageReader, WebSocketMessageWriter } from 'vscode-ws-jsonrpc';
import badPyCode from '../../../resources/python/bad.py?raw';
import helloPyCode from '../../../resources/python/hello.py?raw';
import hello2PyCode from '../../../resources/python/hello2.py?raw';
import { createDefaultWorkspaceContent } from '../../common/client/utils.js';

export const createDefaultConfigParams = (homeDir: string, htmlContainer: HTMLElement): ConfigParams => {
    const files = new Map<string, FileDefinition>();
    const workspaceRoot = `${homeDir}/workspace`;
    const configParams: ConfigParams = {
        extensionName: 'debugger-py-client',
        publisher: 'TypeFox',
        version: '1.0.0',
        languageId: 'python',
        documentSelector: ['python', 'py'],
        homeDir,
        workspaceRoot: `${homeDir}/workspace`,
        workspaceFile: vscode.Uri.file(`${homeDir}/.vscode/workspace.code-workspace`),
        htmlContainer,
        protocol: 'ws',
        hostname: 'localhost',
        port: 55555,
        files,
        defaultFile: `${workspaceRoot}/hello2.py`,
        helpContainerCmd: 'docker compose -f ./packages/examples/resources/debugger/docker-compose.yml up -d',
        debuggerExecCall: 'graalpy --dap --dap.WaitAttached --dap.Suspend=true'
    };
    const helloPyPath = `${workspaceRoot}/hello.py`;
    const hello2PyPath = configParams.defaultFile;
    const badPyPath = `${workspaceRoot}/bad.py`;

    files.set('hello.py', { code: helloPyCode, path: helloPyPath, uri: vscode.Uri.file(helloPyPath) });
    files.set('hello2.py', { code: hello2PyCode, path: hello2PyPath, uri: vscode.Uri.file(hello2PyPath) });
    files.set('bad.py', { code: badPyCode, path: badPyPath, uri: vscode.Uri.file(badPyPath) });

    const fileSystemProvider = new RegisteredFileSystemProvider(false);
    fileSystemProvider.registerFile(new RegisteredMemoryFile(files.get('hello.py')!.uri, helloPyCode));
    fileSystemProvider.registerFile(new RegisteredMemoryFile(files.get('hello2.py')!.uri, hello2PyCode));
    fileSystemProvider.registerFile(new RegisteredMemoryFile(files.get('bad.py')!.uri, badPyCode));
    fileSystemProvider.registerFile(new RegisteredMemoryFile(configParams.workspaceFile, createDefaultWorkspaceContent(workspaceRoot)));
    fileSystemProvider.registerFile(createDebugLaunchConfigFile(workspaceRoot, configParams.languageId));
    registerFileSystemOverlay(1, fileSystemProvider);

    return configParams;
};

export type PythonAppConfig = {
    languageClientConfig: LanguageClientConfig;
    vscodeApiConfig: MonacoVscodeApiConfig;
    editorAppConfig: EditorAppConfig;
    configParams: ConfigParams;
};

export const createPythonAppConfig = (): PythonAppConfig => {
    const configParams = createDefaultConfigParams('/home/mlc', document.body);

    const url = createUrl({
        secured: false,
        host: 'localhost',
        port: 30001,
        path: 'pyright',
        extraParams: {
            authorization: 'UserAuth'
        }
    });
    const webSocket = new WebSocket(url);
    const iWebSocket = toSocket(webSocket);
    const reader = new WebSocketMessageReader(iWebSocket);
    const writer = new WebSocketMessageWriter(iWebSocket);

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
            ...getDebugServiceOverride(),
            ...getTestingServiceOverride(),
            ...getPreferencesServiceOverride()
        },
        viewsConfig: {
            $type: 'ViewsService',
            htmlContainer: configParams.htmlContainer,
            htmlAugmentationInstructions: defaultHtmlAugmentationInstructions,
            viewsInitFunc: defaultViewsInit
        },
        userConfiguration: {
            json: JSON.stringify({
                'workbench.colorTheme': 'Default Dark Modern',
                'editor.guides.bracketPairsHorizontal': 'active',
                'editor.wordBasedSuggestions': 'off',
                'editor.experimental.asyncTokenization': true,
                'debug.toolBarLocation': 'docked'
            })
        },
        workspaceConfig: {
            enableWorkspaceTrust: true,
            windowIndicator: {
                label: 'mlc-python-example',
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
                    workspaceUri: configParams.workspaceFile
                }
            },
            configurationDefaults: {
                'window.title': 'mlc-python-example${separator}${dirty}${activeEditorShort}'
            },
            productConfiguration: {
                nameShort: 'mlc-python-example',
                nameLong: 'mlc-python-example'
            }
        },
        extensions: [
            {
                config: {
                    name: 'mlc-python-example',
                    publisher: 'TypeFox',
                    version: '1.0.0',
                    engines: {
                        vscode: '*'
                    }
                }
            },
            provideDebuggerExtensionConfig(configParams)
        ],
        monacoWorkerFactory: configureDefaultWorkerFactory
    };

    const languageClientConfig: LanguageClientConfig = {
        languageId: 'python',
        connection: {
            options: {
                $type: 'WebSocketDirect',
                webSocket: webSocket,
                startOptions: {
                    onCall: (languageClient?: BaseLanguageClient) => {
                        setTimeout(() => {
                            ['pyright.restartserver', 'pyright.organizeimports'].forEach((cmdName) => {
                                vscode.commands.registerCommand(cmdName, (...args: unknown[]) => {
                                    languageClient?.sendRequest('workspace/executeCommand', { command: cmdName, arguments: args });
                                });
                            });
                        }, 250);
                    },
                    reportStatus: true
                }
            },
            messageTransports: { reader, writer }
        },
        clientOptions: {
            documentSelector: [configParams.languageId],
            workspaceFolder: {
                index: 0,
                name: configParams.workspaceRoot,
                uri: vscode.Uri.parse(configParams.workspaceRoot)
            }
        }
    };

    const editorAppConfig: EditorAppConfig = {};

    return {
        vscodeApiConfig,
        languageClientConfig,
        editorAppConfig,
        configParams: configParams
    };
};
