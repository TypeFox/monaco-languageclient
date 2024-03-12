/* --------------------------------------------------------------------------------------------
 * Copyright (c) 2024 TypeFox GmbH (http://www.typefox.io). All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 * ------------------------------------------------------------------------------------------ */

import * as vscode from 'vscode';
// this is required syntax highlighting
import '@codingame/monaco-vscode-python-default-extension';
import { disposeEditor, startEditor } from '../../common/example-apps-common.js';
import { RegisteredFileSystemProvider, registerFileSystemOverlay, RegisteredMemoryFile } from '@codingame/monaco-vscode-files-service-override';
import { createUserConfig } from './config.js';
import { useWorkerFactory } from 'monaco-editor-wrapper/workerFactory';

export const configureMonacoWorkers = () => {
    useWorkerFactory({
        basePath: '../../../node_modules'
    });
};

export const runPythonWrapper = () => {
    const code = 'print("Hello, World!")';
    const fileSystemProvider = new RegisteredFileSystemProvider(false);
    fileSystemProvider.registerFile(new RegisteredMemoryFile(vscode.Uri.file('/workspace/hello.py'), code));
    registerFileSystemOverlay(1, fileSystemProvider);

    try {
        const userConfig = createUserConfig(code);
        const htmlElement = document.getElementById('monaco-editor-root');
        document.querySelector('#button-start')?.addEventListener('click', async () => {
            await startEditor(userConfig, htmlElement, code);
        });
        document.querySelector('#button-dispose')?.addEventListener('click', async () => {
            await disposeEditor(userConfig.wrapperConfig.editorAppConfig.useDiffEditor);
        });
    } catch (e) {
        console.error(e);
    }
};
