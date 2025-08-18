/* --------------------------------------------------------------------------------------------
 * Copyright (c) 2025 TypeFox and others.
 * Licensed under the MIT License. See LICENSE in the package root for license information.
 * ------------------------------------------------------------------------------------------ */

import { RegisteredFileSystemProvider, RegisteredMemoryFile, registerFileSystemOverlay } from '@codingame/monaco-vscode-files-service-override';
import getKeybindingsServiceOverride from '@codingame/monaco-vscode-keybindings-service-override';
import * as vscode from 'vscode';
// this is required syntax highlighting
import { LogLevel } from '@codingame/monaco-vscode-api';
import '@codingame/monaco-vscode-java-default-extension';
import { EditorApp, type EditorAppConfig } from 'monaco-languageclient/editorApp';
import { configureDefaultWorkerFactory } from 'monaco-languageclient/workerFactory';
import { LanguageClientWrapper, type LanguageClientConfig } from 'monaco-languageclient/lcwrapper';
import { MonacoVscodeApiWrapper, type MonacoVscodeApiConfig } from 'monaco-languageclient/vscodeApiWrapper';

export const runExtendedClient = async (lsConfig: ExampleLsConfig, helloCode: string) => {
    const helloUri = vscode.Uri.file(`${lsConfig.basePath}/workspace/hello.${lsConfig.documentSelector}`);
    const fileSystemProvider = new RegisteredFileSystemProvider(false);
    fileSystemProvider.registerFile(new RegisteredMemoryFile(helloUri, helloCode));
    registerFileSystemOverlay(1, fileSystemProvider);

    const htmlContainer = document.getElementById('monaco-editor-root')!;
    const vscodeApiConfig: MonacoVscodeApiConfig = {
        $type: 'extended',
        htmlContainer,
        logLevel: LogLevel.Debug,
        serviceOverrides: {
            ...getKeybindingsServiceOverride(),
        },
        userConfiguration: {
            json: JSON.stringify({
                'workbench.colorTheme': 'Default Dark Modern',
                'editor.guides.bracketPairsHorizontal': 'active',
                'editor.lightbulb.enabled': 'On',
                'editor.wordBasedSuggestions': 'off',
                'editor.experimental.asyncTokenization': true
            })
        },
        monacoWorkerFactory: configureDefaultWorkerFactory
    };

    const languageClientConfig: LanguageClientConfig = {
        connection: {
            options: {
                $type: 'WebSocketUrl',
                url: `ws://localhost:${lsConfig.port}${lsConfig.path}`,
                startOptions: {
                    onCall: () => {
                        console.log('Connected to socket.');
                    },
                    reportStatus: true
                },
                stopOptions: {
                    onCall: () => {
                        console.log('Disconnected from socket.');
                    },
                    reportStatus: true
                }
            },
        },
        clientOptions: {
            documentSelector: [lsConfig.documentSelector],
            workspaceFolder: {
                index: 0,
                name: 'workspace',
                uri: vscode.Uri.parse(`${lsConfig.basePath}/workspace`)
            }
        }
    };

    const editorAppConfig: EditorAppConfig = {
        $type: vscodeApiConfig.$type,
        codeResources: {
            modified: {
                text: helloCode,
                uri: helloUri.path
            }
        }
    };

    // perform global init
    const apiWrapper = new MonacoVscodeApiWrapper(vscodeApiConfig);
    await apiWrapper.init();

    const lcWrapper = new LanguageClientWrapper(languageClientConfig, apiWrapper.getLogger());
    const editorApp = new EditorApp(editorAppConfig);

    try {
        document.querySelector('#button-start')?.addEventListener('click', async () => {
            await editorApp.start(htmlContainer);
            await lcWrapper.start();

            // open files, so the LS can pick it up
            await vscode.workspace.openTextDocument(helloUri);
        });
        document.querySelector('#button-dispose')?.addEventListener('click', async () => {
            await editorApp.dispose();
            await lcWrapper.dispose();
        });
    } catch (e) {
        console.error(e);
    }
};

export type ExampleLsConfig = {
    port: number;
    path: string;
    basePath: string;
    documentSelector: string;
};
