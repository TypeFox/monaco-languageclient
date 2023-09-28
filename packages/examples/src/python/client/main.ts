/* --------------------------------------------------------------------------------------------
 * Copyright (c) 2018-2022 TypeFox GmbH (http://www.typefox.io). All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 * ------------------------------------------------------------------------------------------ */

import * as monaco from 'monaco-editor';
import * as vscode from 'vscode';
import '@codingame/monaco-vscode-theme-defaults-default-extension';
import '@codingame/monaco-vscode-python-default-extension';
import { LogLevel } from 'vscode/services';
import { createConfiguredEditor, createModelReference } from 'vscode/monaco';
import { ExtensionHostKind, registerExtension } from 'vscode/extensions';
import getConfigurationServiceOverride, { updateUserConfiguration } from '@codingame/monaco-vscode-configuration-service-override';
import getKeybindingsServiceOverride from '@codingame/monaco-vscode-keybindings-service-override';
import getThemeServiceOverride from '@codingame/monaco-vscode-theme-service-override';
import getTextmateServiceOverride from '@codingame/monaco-vscode-textmate-service-override';
import { initServices, MonacoLanguageClient } from 'monaco-languageclient';
import { CloseAction, ErrorAction, MessageTransports } from 'vscode-languageclient';
import { WebSocketMessageReader, WebSocketMessageWriter, toSocket } from 'vscode-ws-jsonrpc';
import { RegisteredFileSystemProvider, registerFileSystemOverlay, RegisteredMemoryFile } from 'vscode/service-override/files';
import { Uri } from 'vscode';
import { createUrl } from '../../common.js';

import { buildWorkerDefinition } from 'monaco-editor-workers';
buildWorkerDefinition('../../../node_modules/monaco-editor-workers/dist/workers/', new URL('', window.location.href).href, false);

const languageId = 'python';
let languageClient: MonacoLanguageClient;

const createWebSocket = (url: string): WebSocket => {
    const webSocket = new WebSocket(url);
    webSocket.onopen = async () => {
        const socket = toSocket(webSocket);
        const reader = new WebSocketMessageReader(socket);
        const writer = new WebSocketMessageWriter(socket);
        languageClient = createLanguageClient({
            reader,
            writer
        });
        await languageClient.start();
        reader.onClose(() => languageClient.stop());
    };
    return webSocket;
};

const createLanguageClient = (transports: MessageTransports): MonacoLanguageClient => {
    return new MonacoLanguageClient({
        name: 'Pyright Language Client',
        clientOptions: {
            // use a language id as a document selector
            documentSelector: [languageId],
            // disable the default error handler
            errorHandler: {
                error: () => ({ action: ErrorAction.Continue }),
                closed: () => ({ action: CloseAction.DoNotRestart })
            },
            // pyright requires a workspace folder to be present, otherwise it will not work
            workspaceFolder: {
                index: 0,
                name: 'workspace',
                uri: monaco.Uri.parse('/workspace')
            },
            synchronize: {
                fileEvents: [vscode.workspace.createFileSystemWatcher('**')]
            }
        },
        // create a language client connection from the JSON RPC connection on demand
        connectionProvider: {
            get: () => {
                return Promise.resolve(transports);
            }
        }
    });
};

export const startPythonClient = async () => {
    // init vscode-api
    await initServices({
        userServices: {
            ...getThemeServiceOverride(),
            ...getTextmateServiceOverride(),
            ...getConfigurationServiceOverride(Uri.file('/workspace')),
            ...getKeybindingsServiceOverride()
        },
        debugLogging: true,
        logLevel: LogLevel.Debug
    });

    // extension configuration derived from:
    // https://github.com/microsoft/pyright/blob/main/packages/vscode-pyright/package.json
    // only a minimum is required to get pyright working
    const extension = {
        name: 'python-client',
        publisher: 'monaco-languageclient-project',
        version: '1.0.0',
        engines: {
            vscode: '^1.78.0'
        },
        contributes: {
            languages: [{
                id: languageId,
                aliases: [
                    'Python'
                ],
                extensions: [
                    '.py',
                    '.pyi'
                ]
            }],
            commands: [{
                command: 'pyright.restartserver',
                title: 'Pyright: Restart Server',
                category: 'Pyright'
            },
            {
                command: 'pyright.organizeimports',
                title: 'Pyright: Organize Imports',
                category: 'Pyright'
            }],
            keybindings: [{
                key: 'ctrl+k',
                command: 'pyright.restartserver',
                when: 'editorTextFocus'
            }]
        }
    };
    registerExtension(extension, ExtensionHostKind.LocalProcess);

    updateUserConfiguration(`{
        "editor.fontSize": 14,
        "workbench.colorTheme": "Default Dark Modern"
    }`);

    const fileSystemProvider = new RegisteredFileSystemProvider(false);
    fileSystemProvider.registerFile(new RegisteredMemoryFile(vscode.Uri.file('/workspace/hello.py'), 'print("Hello, World!")'));
    registerFileSystemOverlay(1, fileSystemProvider);

    // create the web socket and configure to start the language client on open, can add extra parameters to the url if needed.
    createWebSocket(createUrl('localhost', 30000, '/pyright', {
        // Used to parse an auth token or additional parameters such as import IDs to the language server
        authorization: 'UserAuth'
        // By commenting above line out and commenting below line in, connection to language server will be denied.
        // authorization: 'FailedUserAuth'
    }, false));

    const registerCommand = async (cmdName: string, handler: (...args: unknown[]) => void) => {
        // commands sould not be there, but it demonstrates how to retrieve list of all external commands
        const commands = await vscode.commands.getCommands(true);
        if (!commands.includes(cmdName)) {
            vscode.commands.registerCommand(cmdName, handler);
        }
    };
    // always exectute the command with current language client
    await registerCommand('pyright.restartserver', (...args: unknown[]) => {
        languageClient.sendRequest('workspace/executeCommand', { command: 'pyright.restartserver', arguments: args });
    });
    await registerCommand('pyright.organizeimports', (...args: unknown[]) => {
        languageClient.sendRequest('workspace/executeCommand', { command: 'pyright.organizeimports', arguments: args });
    });

    // use the file create before
    const modelRef = await createModelReference(monaco.Uri.file('/workspace/hello.py'));
    modelRef.object.setLanguageId(languageId);

    // create monaco editor
    createConfiguredEditor(document.getElementById('container')!, {
        model: modelRef.object.textEditorModel,
        automaticLayout: true
    });
};
