/* --------------------------------------------------------------------------------------------
 * Copyright (c) 2024 TypeFox and others.
 * Licensed under the MIT License. See LICENSE in the package root for license information.
 * ------------------------------------------------------------------------------------------ */

import * as vscode from 'vscode';
// this is required syntax highlighting
import '@codingame/monaco-vscode-python-default-extension';
import { RegisteredFileSystemProvider, registerFileSystemOverlay, RegisteredMemoryFile } from '@codingame/monaco-vscode-files-service-override';
import { MonacoEditorLanguageClientWrapper } from 'monaco-editor-wrapper';
import { useWorkerFactory } from 'monaco-editor-wrapper/workerFactory';
import { createUserConfig } from './config.js';
import helloPyCode from './hello.py?raw';
import hello2PyCode from './hello2.py?raw';

export const configureMonacoWorkers = () => {
    useWorkerFactory({
        ignoreMapping: true,
        workerLoaders: {
            editorWorkerService: () => new Worker(new URL('monaco-editor/esm/vs/editor/editor.worker.js', import.meta.url), { type: 'module' }),
        }
    });
};

export const runPythonWrapper = async () => {
    const helloPyUri = vscode.Uri.file('/workspace/hello.py');
    const hello2PyUri = vscode.Uri.file('/workspace/hello2.py');

    const fileSystemProvider = new RegisteredFileSystemProvider(false);
    fileSystemProvider.registerFile(new RegisteredMemoryFile(helloPyUri, helloPyCode));
    fileSystemProvider.registerFile(new RegisteredMemoryFile(hello2PyUri, hello2PyCode));

    registerFileSystemOverlay(1, fileSystemProvider);
    const userConfig = createUserConfig('/workspace', helloPyCode, '/workspace/hello.py');
    const htmlElement = document.getElementById('monaco-editor-root');
    const wrapper = new MonacoEditorLanguageClientWrapper();

    try {
        document.querySelector('#button-start')?.addEventListener('click', async () => {
            if (wrapper.isStarted()) {
                console.warn('Editor was already started!');
            } else {
                await wrapper.init(userConfig);

                // open files, so the LS can pick it up
                await vscode.workspace.openTextDocument(hello2PyUri);
                await vscode.workspace.openTextDocument(helloPyUri);

                await wrapper.start(htmlElement);
            }
        });
        document.querySelector('#button-dispose')?.addEventListener('click', async () => {
            await wrapper.dispose();
        });
    } catch (e) {
        console.error(e);
    }
};
