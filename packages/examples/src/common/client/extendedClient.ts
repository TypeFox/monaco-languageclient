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
import { LanguageClientWrapper, type LanguageClientConfig } from 'monaco-languageclient/lcwrapper';
import { MonacoVscodeApiWrapper, type MonacoVscodeApiConfig } from 'monaco-languageclient/vscodeApiWrapper';
import { configureDefaultWorkerFactory } from 'monaco-languageclient/workerFactory';
import { LangiumMonarchContent } from '../../langium/langium-dsl/config/langium.monarch.js';

export const runExtendedClient = async (lsConfig: ExampleLsConfig, helloCode: string) => {
    const helloUri = vscode.Uri.file(`${lsConfig.basePath}/workspace/hello.${lsConfig.languageId}`);
    const fileSystemProvider = new RegisteredFileSystemProvider(false);
    fileSystemProvider.registerFile(new RegisteredMemoryFile(helloUri, helloCode));
    registerFileSystemOverlay(1, fileSystemProvider);

    const htmlContainer = document.getElementById('monaco-editor-root')!;
    const vscodeApiConfig: MonacoVscodeApiConfig = {
        $type: 'extended',
        viewsConfig: {
            $type: 'EditorService',
            htmlContainer
        },
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
        languageId: lsConfig.languageId,
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
            documentSelector: [lsConfig.languageId],
            workspaceFolder: {
                index: 0,
                name: 'workspace',
                uri: vscode.Uri.parse(`${lsConfig.basePath}/workspace`)
            }
        }
    };

    const editorAppConfig: EditorAppConfig = {
        codeResources: {
            modified: {
                text: helloCode,
                uri: helloUri.path
            }
        },
        languageDef: {
            monarchLanguage: LangiumMonarchContent,
            languageExtensionConfig: { id: 'langium' }
        }
    };

    // perform global init
    const apiWrapper = new MonacoVscodeApiWrapper(vscodeApiConfig);
    await apiWrapper.start();

    const lcWrapper = new LanguageClientWrapper(languageClientConfig);
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
    languageId: string;
};
