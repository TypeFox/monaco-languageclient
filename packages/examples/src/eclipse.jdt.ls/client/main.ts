/* --------------------------------------------------------------------------------------------
 * Copyright (c) 2024 TypeFox and others.
 * Licensed under the MIT License. See LICENSE in the package root for license information.
 * ------------------------------------------------------------------------------------------ */

import * as vscode from 'vscode';
import getKeybindingsServiceOverride from '@codingame/monaco-vscode-keybindings-service-override';
import { RegisteredFileSystemProvider, RegisteredMemoryFile, registerFileSystemOverlay } from '@codingame/monaco-vscode-files-service-override';
// this is required syntax highlighting
import '@codingame/monaco-vscode-java-default-extension';
import { MonacoEditorLanguageClientWrapper, WrapperConfig } from 'monaco-editor-wrapper';
import { LogLevel } from 'vscode/services';
import { eclipseJdtLsConfig } from '../config.js';
import helloJavaCode from '../../../resources/eclipse.jdt.ls/workspace/hello.java?raw';
import { configureMonacoWorkers } from '../../common/client/utils.js';

export const runEclipseJdtLsClient = () => {
    const helloJavaUri = vscode.Uri.file(`${eclipseJdtLsConfig.basePath}/workspace/hello.java`);
    const fileSystemProvider = new RegisteredFileSystemProvider(false);
    fileSystemProvider.registerFile(new RegisteredMemoryFile(helloJavaUri, helloJavaCode));
    registerFileSystemOverlay(1, fileSystemProvider);

    const userConfig: WrapperConfig = {
        logLevel: LogLevel.Debug,
        vscodeApiConfig: {
            userServices: {
                ...getKeybindingsServiceOverride(),
            },
            userConfiguration: {
                json: JSON.stringify({
                    'workbench.colorTheme': 'Default Dark Modern',
                    'editor.guides.bracketPairsHorizontal': 'active',
                    'editor.wordBasedSuggestions': 'off',
                    'editor.experimental.asyncTokenization': true
                })
            }
        },
        editorAppConfig: {
            $type: 'extended',
            codeResources: {
                main: {
                    text: helloJavaCode,
                    uri: `${eclipseJdtLsConfig.basePath}/workspace/hello.java`
                }
            },
            useDiffEditor: false,
            monacoWorkerFactory: configureMonacoWorkers,
            htmlContainer: document.getElementById('monaco-editor-root')!
        },
        languageClientConfigs: {
            java: {
                connection: {
                    options: {
                        $type: 'WebSocketUrl',
                        url: 'ws://localhost:30003/jdtls'
                    }
                },
                clientOptions: {
                    documentSelector: ['java'],
                    workspaceFolder: {
                        index: 0,
                        name: 'workspace',
                        uri: vscode.Uri.parse(`${eclipseJdtLsConfig.basePath}/workspace`)
                    }
                }
            }
        }
    };

    const wrapper = new MonacoEditorLanguageClientWrapper();

    try {
        document.querySelector('#button-start')?.addEventListener('click', async () => {
            await wrapper.init(userConfig);

            // open files, so the LS can pick it up
            await vscode.workspace.openTextDocument(helloJavaUri);

            await wrapper.start();
        });
        document.querySelector('#button-dispose')?.addEventListener('click', async () => {
            await wrapper.dispose();
        });
    } catch (e) {
        console.error(e);
    }
};
