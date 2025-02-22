/* --------------------------------------------------------------------------------------------
 * Copyright (c) 2024 TypeFox and others.
 * Licensed under the MIT License. See LICENSE in the package root for license information.
 * ------------------------------------------------------------------------------------------ */

import * as vscode from 'vscode';
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
import getDebugServiceOverride from '@codingame/monaco-vscode-debug-service-override';
import getTestingServiceOverride from '@codingame/monaco-vscode-testing-service-override';
import getPreferencesServiceOverride from '@codingame/monaco-vscode-preferences-service-override';
import getWorkingCopyServiceOverride from '@codingame/monaco-vscode-working-copy-service-override';
import { registerFileSystemOverlay } from '@codingame/monaco-vscode-files-service-override';
import '@codingame/monaco-vscode-python-default-extension';
import { LogLevel } from '@codingame/monaco-vscode-api';
import { MonacoLanguageClient } from 'monaco-languageclient';
import { createUrl } from 'monaco-languageclient/tools';
import { createDefaultLocaleConfiguration } from 'monaco-languageclient/vscode/services';
import {
    toSocket,
    WebSocketMessageReader,
    WebSocketMessageWriter,
} from 'vscode-ws-jsonrpc';
import type { WrapperConfig } from 'monaco-editor-wrapper';
import {
    defaultHtmlAugmentationInstructions,
    defaultViewsInit,
} from 'monaco-editor-wrapper/vscode/services';
import { configureDefaultWorkerFactory } from 'monaco-editor-wrapper/workers/workerLoaders';
import { provideDebuggerExtensionConfig } from '../../debugger/client/debugger.js';
import { type ConfigParams } from '../../debugger/common/definitions.js';
import {
    MonacoFileSystemProvider,
    type Files,
} from '../../debugger/common/fileSystemProvider.js';
import helloPyCode from '../../../resources/python/hello.py?raw';
import hello2PyCode from '../../../resources/python/hello2.py?raw';
import badPyCode from '../../../resources/python/bad.py?raw';

export const createDefaultConfigParams = (
    files: Files,
    htmlContainer?: HTMLElement,
): ConfigParams => {
    const homeId = String(Date.now());
    const homeDir = `/tmp/${homeId}`;
    const fileSystemProvider = new MonacoFileSystemProvider({
        type: 'directory',
        files: {
            tmp: {
                type: 'directory',
                files: {
                    [homeId]: {
                        type: 'directory',
                        files: {
                            ['.vscode']: {
                                type: 'directory',
                                files: {
                                    ['workspace.code-workspace']: {
                                        type: 'text',
                                        updated: Date.now(),
                                        text: JSON.stringify(
                                            {
                                                folders: [
                                                    {
                                                        path: `${homeDir}/workspace`,
                                                    },
                                                ],
                                            },
                                            null,
                                            2,
                                        ),
                                    },
                                },
                            },
                            ['workspace']: files,
                        },
                    },
                },
            },
        },
    });

    const configParams: ConfigParams = {
        extensionName: 'debugger-py-client',
        languageId: 'python',
        documentSelector: ['python', 'py'],
        homeDir,
        workspaceRoot: `${homeDir}/workspace`,
        workspaceFile: vscode.Uri.file(
            `${homeDir}/.vscode/workspace.code-workspace`,
        ),
        htmlContainer,
        protocol: 'ws',
        hostname: 'localhost',
        port: 55555,
        fileSystemProvider,
        defaultFile: vscode.Uri.file(`${homeDir}/workspace/hello2.py`),
        helpContainerCmd:
            'docker compose -f ./packages/examples/resources/debugger/docker-compose.yml up -d',
        debuggerExecCall: 'graalpy --dap --dap.WaitAttached --dap.Suspend=true',
    };

    // const fileSystemProvider = new RegisteredFileSystemProvider(false);
    // fileSystemProvider.registerFile(
    //     createDefaultWorkspaceFile(configParams.workspaceFile, workspaceRoot)
    // );
    // fileSystemProvider.registerFile(
    //     createDebugLaunchConfigFile(workspaceRoot, configParams.languageId)
    // );
    registerFileSystemOverlay(1, fileSystemProvider);

    return configParams;
};

export type PythonAppConfig = {
    wrapperConfig: WrapperConfig;
    configParams: ConfigParams;
};

export const createWrapperConfig = (): PythonAppConfig => {
    const files: Files = {
        type: 'directory',
        files: {
            'hello.py': {
                type: 'text',
                updated: Date.now(),
                text: helloPyCode,
            },
            'hello2.py': {
                type: 'text',
                updated: Date.now(),
                text: hello2PyCode,
            },
            'bad.py': { type: 'text', updated: Date.now(), text: badPyCode },
        },
    };

    const configParams = createDefaultConfigParams(files, document.body);

    const url = createUrl({
        secured: false,
        host: 'localhost',
        port: 30001,
        path: 'pyright',
        extraParams: {
            authorization: 'UserAuth',
        },
    });
    const webSocket = new WebSocket(url);
    const iWebSocket = toSocket(webSocket);
    const reader = new WebSocketMessageReader(iWebSocket);
    const writer = new WebSocketMessageWriter(iWebSocket);

    const wrapperConfig: WrapperConfig = {
        $type: 'extended',
        htmlContainer: configParams.htmlContainer,
        logLevel: LogLevel.Debug,
        languageClientConfigs: {
            python: {
                name: 'Python Language Server Example',
                connection: {
                    options: {
                        $type: 'WebSocketDirect',
                        webSocket: webSocket,
                        startOptions: {
                            onCall: (languageClient?: MonacoLanguageClient) => {
                                setTimeout(() => {
                                    [
                                        'pyright.restartserver',
                                        'pyright.organizeimports',
                                    ].forEach((cmdName) => {
                                        vscode.commands.registerCommand(
                                            cmdName,
                                            (...args: unknown[]) => {
                                                void languageClient?.sendRequest(
                                                    'workspace/executeCommand',
                                                    {
                                                        command: cmdName,
                                                        arguments: args,
                                                    },
                                                );
                                            },
                                        );
                                    });
                                }, 250);
                            },
                            reportStatus: true,
                        },
                    },
                    messageTransports: { reader, writer },
                },
                clientOptions: {
                    documentSelector: [configParams.languageId],
                    workspaceFolder: {
                        index: 0,
                        name: configParams.workspaceRoot,
                        uri: vscode.Uri.parse(configParams.workspaceRoot),
                    },
                },
            },
        },
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
                ...getStorageServiceOverride(),
                ...getSearchServiceOverride(),
                ...getDebugServiceOverride(),
                ...getTestingServiceOverride(),
                ...getPreferencesServiceOverride(),
                ...getWorkingCopyServiceOverride(),
            },
            viewsConfig: {
                viewServiceType: 'ViewsService',
                htmlAugmentationInstructions:
                    defaultHtmlAugmentationInstructions,
                viewsInitFunc: defaultViewsInit,
            },
            userConfiguration: {
                json: JSON.stringify({
                    'workbench.colorTheme': 'Default Dark Modern',
                    'editor.guides.bracketPairsHorizontal': 'active',
                    'editor.wordBasedSuggestions': 'off',
                    'editor.experimental.asyncTokenization': true,
                    'debug.toolBarLocation': 'docked',
                    'files.autoSave': 'afterDelay',
                    'files.autoSaveDelay': 100,
                }),
            },
            workspaceConfig: {
                enableWorkspaceTrust: true,
                windowIndicator: {
                    label: 'mlc-python-example',
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
                        workspaceUri: configParams.workspaceFile,
                    },
                },
                configurationDefaults: {
                    'window.title':
                        'mlc-python-example${separator}${dirty}${activeEditorShort}',
                },
                productConfiguration: {
                    nameShort: 'mlc-python-example',
                    nameLong: 'mlc-python-example',
                },
            },
        },
        extensions: [
            {
                config: {
                    name: 'mlc-python-example',
                    publisher: 'TypeFox',
                    version: '1.0.0',
                    engines: {
                        vscode: '*',
                    },
                },
            },
            provideDebuggerExtensionConfig(configParams),
        ],
        editorAppConfig: {
            monacoWorkerFactory: configureDefaultWorkerFactory,
        },
    };

    return {
        wrapperConfig,
        configParams: configParams,
    };
};
