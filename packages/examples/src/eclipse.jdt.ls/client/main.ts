/* --------------------------------------------------------------------------------------------
 * Copyright (c) 2024 TypeFox and others.
 * Licensed under the MIT License. See LICENSE in the package root for license information.
 * ------------------------------------------------------------------------------------------ */

import * as vscode from 'vscode';
import getKeybindingsServiceOverride from '@codingame/monaco-vscode-keybindings-service-override';
// this is required syntax highlighting
import '@codingame/monaco-vscode-java-default-extension';
import { MonacoEditorLanguageClientWrapper, UserConfig } from 'monaco-editor-wrapper';
import { useWorkerFactory } from 'monaco-editor-wrapper/workerFactory';
import { RegisteredFileSystemProvider, RegisteredMemoryFile } from '@codingame/monaco-vscode-files-service-override';
import helloJavaCode from '../../../resources/eclipse.jdt.ls/workspace/hello.java?raw';
import { eclipseJdtLsConfig } from '../config';

export const configureMonacoWorkers = () => {
    useWorkerFactory({
        ignoreMapping: true,
        workerLoaders: {
            editorWorkerService: () => new Worker(new URL('monaco-editor/esm/vs/editor/editor.worker.js', import.meta.url), { type: 'module' }),
        }
    });
};

export const runEclipseJdtLsClient = () => {
    const helloJavaUri = vscode.Uri.file(`${eclipseJdtLsConfig.basePath}/workspace/hello.java`);
    const fileSystemProvider = new RegisteredFileSystemProvider(false);
    fileSystemProvider.registerFile(new RegisteredMemoryFile(helloJavaUri, helloJavaCode));

    const userConfig: UserConfig = {
        wrapperConfig: {
            serviceConfig: {
                userServices: {
                    ...getKeybindingsServiceOverride(),
                },
                debugLogging: true
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
                userConfiguration: {
                    json: JSON.stringify({
                        'workbench.colorTheme': 'Default Dark Modern',
                        'editor.guides.bracketPairsHorizontal': 'active'
                    })
                }
            }
        },
        languageClientConfig: {
            languageId: 'java',
            options: {
                $type: 'WebSocketUrl',
                url: 'ws://localhost:30003/jdtls'
            },
            clientOptions: {
                documentSelector: ['java'],
                workspaceFolder: {
                    index: 0,
                    name: 'workspace',
                    uri: vscode.Uri.parse(`${eclipseJdtLsConfig.basePath}/workspace`)
                },
            },
        }
    };

    const wrapper = new MonacoEditorLanguageClientWrapper();
    const htmlElement = document.getElementById('monaco-editor-root');

    try {
        document.querySelector('#button-start')?.addEventListener('click', async () => {
            await wrapper.dispose();
            await wrapper.initAndStart(userConfig, htmlElement);
        });
        document.querySelector('#button-dispose')?.addEventListener('click', async () => {
            await wrapper.dispose();
        });
    } catch (e) {
        console.error(e);
    }
};
